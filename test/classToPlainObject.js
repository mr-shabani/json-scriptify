const { types } = require("util");
/**
 * @typedef {Object} classToPlainObject
 * @property {string|function|function[]} type
 * @property {function(any):any} toPlainObject Convert a class instance to a plain object
 *  that contains important data that must be checked for similarity check.
 */

/**
 * Array of types and their toPlainObject methods.
 * @type {classToPlainObject[]}
 */
let classes = [
	{
		type: "symbol",
		toPlainObject: function(sym) {
			return Symbol.prototype.toString.call(sym);
		}
	},
	{
		type: Date,
		isTypeOf: types.isDate,
		toPlainObject: function(date) {
			return date.getTime();
		}
	},
	{
		type: RegExp,
		isTypeOf: types.isRegExp,
		toPlainObject: function(regexp) {
			return regexp.toString();
		}
	},
	{
		type: Map,
		isTypeOf: types.isMap,
		toPlainObject: function(map) {
			return Array.from(map);
		}
	},
	{
		// comparing two sets is a complex issue. We consider only simple scenarios.
		type: Set,
		isTypeOf: types.isSet,
		toPlainObject: function(set) {
			return Array.from(set).sort((a, b) => String(a) < String(b));
		}
	},
	{
		type: Symbol,
		isTypeOf: types.isSymbolObject,
		toPlainObject: function(sym) {
			return sym.valueOf();
		}
	},
	{
		type: Object.getPrototypeOf(Int8Array), // TypedArray class
		isTypeOf: types.isTypedArray,
		toPlainObject: function(typedArray) {
			return [
				typedArray.buffer,
				typedArray.byteOffset,
				typedArray.length,
				typedArray.__proto__.constructor.name
			];
		}
	},
	{
		type: DataView,
		isTypeOf: types.isDataView,
		toPlainObject: function(dataView) {
			return [dataView.buffer, dataView.byteOffset, dataView.length];
		}
	},
	{
		type: ArrayBuffer,
		isTypeOf: types.isArrayBuffer,
		toPlainObject: function(buff) {
			return Array.from(new Uint8Array(buff));
		}
	},
	{
		type: SharedArrayBuffer,
		isTypeOf: types.isSharedArrayBuffer,
		toPlainObject: function(buff) {
			return Array.from(new Uint8Array(buff));
		}
	},
	{
		type: "function",
		toPlainObject: function(func) {
			return Function.prototype.toString.call(func);
		}
	}
];

module.exports = classes;
