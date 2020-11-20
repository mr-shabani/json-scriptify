/* eslint-disable no-undef */
"use strict";
const { types: utilTypes } = require("util");
const {
	objectIsSame,
	getSameProperties,
	cleanKey,
	insertBetween,
	hideKeys,
	innerObject,
	isBigIntObject
} = require("./helper");

const classToScript = require("./classToScript");

const { ExpressionClass } = require("./ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const classes = [
	{
		type: "symbol",
		toScript: function(obj) {
			let symbolDescription = String(obj).slice(7, -1);
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
			this.ignoreProperties = getSameProperties(obj, obj.toString());
			return obj.toString();
		}
	},
	{
		type: Map,
		isTypeOf: utilTypes.isMap,
		toScript: function(obj, getScript, path) {
			let mapContentArray = Array.from(obj);
			if (mapContentArray.length == 0) return "new Map()";
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: "new Map()",
				add: makeExpression(
					getScript(
						new innerObject(mapContentArray.map(x => new innerObject(x)))
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
			let setContentArray = Array.from(obj);
			if (setContentArray.length == 0) return "new Set()";
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: "new Set()",
				add: makeExpression(
					getScript(new innerObject(setContentArray)),
					".forEach((v)=>{",
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
			let ErrorName = Object.getPrototypeOf(obj).constructor.name;
			let script = `new ${ErrorName}(${JSON.stringify(obj.message)})`;
			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = getSameProperties(obj, script);
			return script;
		}
	},
	{
		type: DataView,
		isTypeOf: utilTypes.isDataView,
		toScript: function(obj, getScript, path) {
			let length =
				obj.byteLength == obj.buffer.byteLength - obj.byteOffset
					? ""
					: "," + obj.byteLength;
			let byteOffset =
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
			let TypedArrayName = Object.getPrototypeOf(obj).constructor.name;
			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = [...Array(obj.length).keys()].map(String);
			let length =
				obj.length * obj.BYTES_PER_ELEMENT ==
				obj.buffer.byteLength - obj.byteOffset
					? ""
					: "," + obj.length;
			let byteOffset =
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
			let uint8 = new Uint8Array(obj);
			let content = "";
			uint8.forEach(v => {
				content += (v < 16 ? "0" : "") + v.toString(16);
			});
			let allZeroRegExp = /^0*$/;
			if (allZeroRegExp.test(content))
				return `new ArrayBuffer(${obj.byteLength})`;
			return `Uint8Array.from("${content}".match(/../g),v=>parseInt(v,16)).buffer`;
		}
	},
	{
		type: SharedArrayBuffer,
		isTypeOf: utilTypes.isSharedArrayBuffer,
		toScript: function(obj, getScript, path) {
			let uint8 = new Uint8Array(obj);
			let content = "";
			uint8.forEach(v => {
				content += (v < 16 ? "0" : "") + v.toString(16);
			});
			let allZeroRegExp = /^0*$/;
			if (allZeroRegExp.test(content))
				return `new SharedArrayBuffer(${obj.byteLength})`;
			let newPath = path.newPath();
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
		type: "function",
		toScript: function(obj, getScript, path) {
			var scriptArray;
			let stringOfObj = obj.toString();
			const nativeFunctionRegExp = /\{\s*\[native code]\s*}$/;
			if (nativeFunctionRegExp.test(stringOfObj)) {
				throw new TypeError("native code functions cannot be scriptified!");
			}

			const classRegExp = /^class\s+[a-zA-Z_]\w*/;
			if (classRegExp.test(stringOfObj)) {
				scriptArray = classToScript(obj, getScript, path, makeExpression);
			} else scriptArray = [stringOfObj];

			if (obj.prototype) {
				let default_prototype = { constructor: obj };
				default_prototype.__proto__ = obj.prototype.__proto__;
				if (!objectIsSame(obj.prototype, default_prototype)) {
					let prototypePath = path.addWithNewInitTime("prototype");
					let prototypeScript;
					if (obj.prototype.constructor == obj)
						prototypeScript = getScript(
							hideKeys(obj.prototype, ["constructor"]),
							prototypePath
						);
					else prototypeScript = getScript(obj.prototype, prototypePath);
					scriptArray.push(
						makeExpression(
							"Object.assign(",
							prototypePath,
							",",
							prototypeScript.popInit(),
							")"
						),
						prototypeScript
					);
				}
			}
			try {
				this.ignoreProperties = getSameProperties(obj, scriptArray[0]);
			} catch (e) {
				this.ignoreProperties = [];
			}
			if (path.key == obj.name) this.ignoreProperties.push("name");
			this.ignoreProperties.push("prototype");
			return scriptArray;
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
			var initScript = [[]];
			var addScript = [[]];
			var lastIndex = -1;
			var scriptIndex = 0;
			var initTime = path.initTime;
			obj.forEach((element, index) => {
				if (lastIndex != index - 1) {
					initScript[++scriptIndex] = `.length = ${index}`;
					initScript[++scriptIndex] = [];
					addScript[scriptIndex] = [];
					initTime = path.getNewInitTime();
				}
				let indexPath = path.add(index.toString());
				indexPath.initTime = initTime;
				let elementScript = getScript(element, indexPath);
				let elementInit = elementScript.popInit();
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
		// This item always must be at the end of the list
		type: "object",
		toScript: function(obj, getScript, path) {
			var entries = Object.entries(obj).filter(([key]) => {
				var descriptor = Object.getOwnPropertyDescriptor(obj, key);
				return descriptor.configurable && descriptor.writable;
			});
			var script = entries.map(([key, value]) => [
				key,
				getScript(value, path.add(key))
			]);

			/** @type {string[]} object keys that will be ignored in produce script*/
			this.ignoreProperties = entries.map(([key]) => key);

			let expression = [];

			script.forEach(([key, valScript]) => {
				let initValueScript = valScript.popInit();
				if (initValueScript.isEmpty() == false)
					expression.push(cleanKey(key), ":", initValueScript, ",");
			});
			expression.pop();
			/** 'init' expressions will be inserted at the first and
			 *  'add' expressions will be inserted at the last.*/
			return {
				init: makeExpression(path, "=", "{", expression, "}"),
				add: script.map(([, valScript]) => valScript)
			};
		}
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
