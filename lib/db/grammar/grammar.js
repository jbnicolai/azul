'use strict';

var util = require('util');
var Class = require('../../util/class');
var Fragment = require('./fragment');

/**
 * Documentation forthcoming.
 *
 * Just for building conditions.
 *
 * @since 1.0
 * @public
 * @constructor
 */
var Grammar = Class.extend();

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {String} string The value to quote.
 * @return {String} A quoted value.
 */
Grammar.prototype.quote = function(string) {
  return '"' + string + '"';
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {String} string The field name to escape.
 * @return {(String|Fragment)} The field name converted to a fragment and
 * converted as required.
 */
Grammar.prototype.field = function(field) {
  var components = field.split('.');
  var quoted = components.map(this.quote, this);
  return quoted.join('.');
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {string} value A value to handle.
 * @return {(String|Fragment)} The value converted to a fragment and converted
 * as required.
 */
Grammar.prototype.value = function(value) {
  return new Fragment('?', [value]);
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {(String|Fragment)} lhs The left hand side of the expression.
 * @param {String} predicate The predicate format string for the expression.
 * @param {(String|Fragment)} rhs The right hand side of the expression.
 * @return {Array.<String|Fragment>} An array of fragments.
 */
Grammar.prototype.expression = function(lhs, predicate, rhs) {
  var rhsArgs = rhs instanceof Fragment ? rhs.arguments : [];
  var rhsString = util.format(predicate, rhs.toString());
  var rhsFragment = new Fragment(rhsString, rhsArgs);
  return [lhs, ' ', rhsFragment];
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {Array.<String|Fragment>} lhs The left hand side of the operation.
 * @param {String} operator The operator of the operation.
 * @param {Array.<String|Fragment>} rhs The right hand side of the operation.
 * @return {Array.<String|Fragment>} An array of fragments.
 */
Grammar.prototype.operation = function(lhs, operator, rhs) {
  return [].concat(lhs, [' ', operator, ' '], rhs);
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {String} operator The operator of the operation.
 * @param {Array.<String|Fragment>} operand The operand of the operation.
 * @return {Array.<String|Fragment>} An array of fragments.
 */
Grammar.prototype.unary = function(operator, operand) {
  return [operator, ' '].concat(operand);
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {(String|Fragment)} expression The expression to group.
 * @return {Array.<String|Fragment>} An array of fragments.
 */
Grammar.prototype.group = function(expression) {
  return ['(', expression, ')'];
};

/**
 * Documentation forthcoming.
 *
 * @since 1.0
 * @public
 * @method
 * @param {Array.<String|Fragment>} fragments An array of fragments.
 * @return {Fragment} A single fragment.
 */
Grammar.prototype.joinFragments = function(fragments) {
  var strings = [];
  var args = [];
  fragments.forEach(function(fragment) {
    strings.push(fragment.toString());
    args = fragment instanceof Fragment ?
      args.concat(fragment.arguments) : args;
  });
  return new Fragment(strings.join(''), args);
};

module.exports = Grammar;