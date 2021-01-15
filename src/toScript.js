/* eslint-disable no-undef */
"use strict";
const { types: utilTypes } = require("util");
const {
	getSamePropertiesWhenEvaluated,
	insertBetween,
	InnerObject,
	isBigIntObject,
} = require("./utility");

const funcToScript = require("./functions/funcToScript");
const objectToScript = require("./objectToScript");

const { ExpressionClass } = require("./ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

/**
 * @typedef {Object} ClassToScript
 * @property {(string|function|function[])} type
 * @property {function(any):boolean} [isTypeOf]
 * @property {function(any,getScript=,PathClass=)} toScript
 * @property {string[]} [ignoreProperties]
 */

/** @type {Array.<ClassToScript>} */
const classes = [
	{
		type: "symbol",
		toScript: function(obj) {
			const symbolDescription = String(obj).slice(7, -1);
			return `Symbol("${symbolDescription}")`;
		}
	},
	{
		type: Number,
		isTypeOf: utilTypes.isNumberObject,
		toScript: function(obj) {
			return `new Number(${JSON.stringify(obj)})`;
		}
	},
	{
		type: BigInt,
		isTypeOf: isBigIntObject,
		toScript: function(obj) {
			return `Object(BigInt(${obj.valueOf().toString()}))`;
		}
	},
	{
		type: Boolean,
		isTypeOf: utilTypes.isBooleanObject,
		toScript: function(obj) {
			return `new Boolean(${JSON.stringify(obj)})`;
		}
	},
	{
		type: String,
		isTypeOf: utilTypes.isStringObject,
		toScript: function(obj) {
			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = ["length"];
			for (let i = 0; i < obj.length; ++i)
				if (Object.prototype.hasOwnProperty.call(obj, i))
					this.ignoreProperties.push(i.toString());
			return `new String(${JSON.stringify(obj)})`;
		}
	},
	{
		type: Symbol,
		isTypeOf: utilTypes.isSymbolObject,
		toScript: function(obj, getScript, path) {
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: makeExpression(),
				add: makeExpression(path, "=", "Object(", getScript(obj.valueOf()), ")")
			};
		}
	},
	{
		type: Date,
		isTypeOf: utilTypes.isDate,
		toScript: function(obj) {
			return `new Date(${obj.getTime()})`;
		}
	},
	{
		type: RegExp,
		isTypeOf: utilTypes.isRegExp,
		toScript: function(obj) {
			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = getSamePropertiesWhenEvaluated(
				obj,
				obj.toString()
			);
			return obj.toString();
		}
	},
	{
		type: Map,
		isTypeOf: utilTypes.isMap,
		toScript: function(obj, getScript, path) {
			const mapContentArray = Array.from(obj);
			if (mapContentArray.length == 0) return "new Map()";
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: "new Map()",
				add: makeExpression(
					getScript(
						new InnerObject(mapContentArray.map(x => new InnerObject(x)))
					),
					".forEach(([k,v])=>{",
					path,
					".set(k,v);})"
				)
			};
		}
	},
	{
		type: Set,
		isTypeOf: utilTypes.isSet,
		toScript: function(obj, getScript, path) {
			const setContentArray = Array.from(obj);
			if (setContentArray.length == 0) return "new Set()";
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: "new Set()",
				add: makeExpression(
					getScript(new InnerObject(setContentArray)),
					".forEach(v=>{",
					path,
					".add(v);})"
				)
			};
		}
	},
	{
		type: [
			Error,
			TypeError,
			EvalError,
			SyntaxError,
			URIError,
			RangeError,
			ReferenceError
		],
		isTypeOf: utilTypes.isNativeError,
		toScript: function(obj) {
			const ErrorName = Object.getPrototypeOf(obj).constructor.name;
			const script = `new ${ErrorName}(${JSON.stringify(obj.message)})`;
			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = getSamePropertiesWhenEvaluated(obj, script);
			return script;
		}
	},
	{
		type: DataView,
		isTypeOf: utilTypes.isDataView,
		toScript: function(obj, getScript, path) {
			const length =
				obj.byteLength == obj.buffer.byteLength - obj.byteOffset
					? ""
					: "," + obj.byteLength;
			const byteOffset =
				obj.byteOffset == 0 && length == "" ? "" : "," + obj.byteOffset;
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: makeExpression(),
				add: makeExpression(
					path,
					"=new DataView(",
					getScript(obj.buffer),
					`${byteOffset}${length})`
				)
			};
		}
	},
	{
		type: [
			Uint8Array,
			Int8Array,
			Uint8ClampedArray,
			Uint16Array,
			Int16Array,
			Uint32Array,
			Int32Array,
			Float32Array,
			Float64Array,
			BigInt64Array,
			BigUint64Array
		],
		isTypeOf: utilTypes.isTypedArray,
		toScript: function(obj, getScript, path) {
			const TypedArrayName = Object.getPrototypeOf(obj).constructor.name;
			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = [...Array(obj.length).keys()].map(String);
			const length =
				obj.length * obj.BYTES_PER_ELEMENT ==
				obj.buffer.byteLength - obj.byteOffset
					? ""
					: "," + obj.length;
			const byteOffset =
				obj.byteOffset == 0 && length == "" ? "" : "," + obj.byteOffset;
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: makeExpression(),
				add: makeExpression(
					path,
					`=new ${TypedArrayName}(`,
					getScript(obj.buffer),
					`${byteOffset}${length}`,
					")"
				)
			};
		}
	},
	{
		type: ArrayBuffer,
		isTypeOf: utilTypes.isArrayBuffer,
		toScript: function(obj) {
			const uint8 = new Uint8Array(obj);
			let content = "";
			uint8.forEach(v => {
				content += (v < 16 ? "0" : "") + v.toString(16);
			});
			const allZeroRegExp = /^0*$/;
			if (allZeroRegExp.test(content))
				return `new ArrayBuffer(${obj.byteLength})`;
			return `Uint8Array.from("${content}".match(/../g),v=>parseInt(v,16)).buffer`;
		}
	},
	{
		type: SharedArrayBuffer,
		isTypeOf: utilTypes.isSharedArrayBuffer,
		toScript: function(obj, getScript, path) {
			const uint8 = new Uint8Array(obj);
			let content = "";
			uint8.forEach(v => {
				content += (v < 16 ? "0" : "") + v.toString(16);
			});
			const allZeroRegExp = /^0*$/;
			if (allZeroRegExp.test(content))
				return `new SharedArrayBuffer(${obj.byteLength})`;
			const newPath = path.newPath();
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: `new SharedArrayBuffer(${obj.byteLength})`,
				add: [
					makeExpression(newPath, "= new Uint8Array(", path, ")"),
					makeExpression(
						`"${content}".match(/../g).map(v=>parseInt(v,16)).forEach((v,i)=>{`,
						newPath,
						"[i]=v;})"
					)
				]
			};
		}
	},
	{
		type: WeakSet,
		isTypeOf: utilTypes.isWeakSet,
		toScript: function() {
			throw new TypeError("WeakSet cannot be scriptify!");
		}
	},
	{
		type: WeakMap,
		isTypeOf: utilTypes.isWeakMap,
		toScript: function() {
			throw new TypeError("WeakMap cannot be scriptify!");
		}
	},
	{
		type: Array,
		isTypeOf: Array.isArray,
		toScript: function(obj, getScript, path) {
			let initScript = [[]];
			const addScript = [[]];
			let lastIndex = -1;
			let scriptIndex = 0;
			let initTime = path.initTime;
			obj.forEach((element, index) => {
				if (lastIndex != index - 1) {
					initScript[++scriptIndex] = `.length = ${index}`;
					initScript[++scriptIndex] = [];
					addScript[scriptIndex] = [];
					initTime = path._getNewInitTime();
				}
				const indexPath = path.add(index.toString());
				indexPath.initTime = initTime;
				const elementScript = getScript(element, indexPath);
				const elementInit = elementScript.popInit();
				if (elementInit.isEmpty()) initScript[scriptIndex].push("null");
				else initScript[scriptIndex].push(elementInit);
				addScript[scriptIndex].push(elementScript);
				lastIndex = index;
			});
			if (lastIndex + 1 < obj.length)
				initScript[++scriptIndex] = `.length = ${obj.length}`;

			initScript = initScript.map((scriptText, index) => {
				if (index == 0)
					return makeExpression(
						path,
						"=",
						"[",
						insertBetween(scriptText, ","),
						"]"
					);
				if (scriptText[0] == ".") return makeExpression(path, scriptText);
				return makeExpression(
					path,
					".push(",
					insertBetween(scriptText, ","),
					")"
				);
			});

			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = ["length"];
			obj.forEach((element, index) => {
				this.ignoreProperties.push(index.toString());
			});

			return {
				init: initScript,
				add: addScript
			};
		}
	},
	{
		type: "function",
		toScript: funcToScript
	},
	{
		// This item always must be at the end of the list
		type: "object",
		toScript: objectToScript
	}
];

/**
 * @typedef {Object} typeToScript
 * @property {function(any):boolean} isTypeOf
 * @property {function(any):string} toScript
 */

/**
 * Array of types and their toScript methods.
 * @type {typeToScript[]}
 */
const types = [
	{
		isTypeOf: obj => typeof obj == "bigint",
		toScript: function(obj) {
			return `BigInt(${obj.toString()})`;
		}
	},
	{
		isTypeOf: obj => Object.is(obj, null),
		toScript: function() {
			return "null";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, undefined),
		toScript: function() {
			return "undefined";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, NaN),
		toScript: function() {
			return "NaN";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, Infinity),
		toScript: function() {
			return "Infinity";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, -Infinity),
		toScript: function() {
			return "-Infinity";
		}
	},
	{
		isTypeOf: obj => typeof obj == "string",
		toScript: function(obj) {
			return JSON.stringify(obj);
		}
	},
	{
		isTypeOf: obj => typeof obj == "boolean",
		toScript: function(obj) {
			return obj.toString();
		}
	},
	{
		isTypeOf: obj => typeof obj == "number",
		toScript: function(obj) {
			return obj.toString();
		}
	}
];

module.exports = { classes, types };
