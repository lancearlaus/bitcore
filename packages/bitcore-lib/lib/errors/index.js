'use strict';

var _ = require('lodash');

function format(message, args) {
  return message
    .replace('{0}', args[0])
    .replace('{1}', args[1])
    .replace('{2}', args[2]);
}

/**
 * @typedef {Error} NodeError
 */

/**
 * @template {Error|NodeError} Parent
 * @param {new Parent} parent - parent error type
 * @param {*} errorDefinition - error specification
 * @returns {new NodeError}
 */
function traverseNode(parent, errorDefinition) {
  /**
   * @constructor
   */
  function NodeError() {
    if (_.isString(errorDefinition.message)) {
      this.message = format(errorDefinition.message, arguments);
    } else if (_.isFunction(errorDefinition.message)) {
      this.message = errorDefinition.message.apply(null, arguments);
    } else {
      throw new Error('Invalid error definition for ' + errorDefinition.name);
    }
    this.stack = this.message + '\n' + (new global.Error()).stack;
  };
  NodeError.prototype = Object.create(parent.prototype);
  NodeError.prototype.name = parent.prototype.name + errorDefinition.name;
  parent[errorDefinition.name] = NodeError;
  if (errorDefinition.errors) {
    childDefinitions(NodeError, errorDefinition.errors);
  }
  return NodeError;
};

/* jshint latedef: false */
function childDefinitions(parent, childDefinitions) {
  _.each(childDefinitions, function(childDefinition) {
    traverseNode(parent, childDefinition);
  });
};
/* jshint latedef: true */

function traverseRoot(parent, errorsDefinition) {
  childDefinitions(parent, errorsDefinition);
  return parent;
};


/**
 * @constructor
 */
function Error() {
  this.message = 'Internal error';
  this.stack = this.message + '\n' + (new global.Error()).stack;
};
Error.prototype = Object.create(global.Error.prototype);
Error.prototype.name = 'bitcore.Error';


var data = require('./spec');
traverseRoot(Error, data);

/**
 * @memberof Error
 * @param {*} spec
 * @returns Error
 */
Error.extend = function extend(spec) {
  return traverseNode(Error, spec);
};

module.exports = Error;
