var {
	objectHasOnly,
	getSameProperties,
	cleanKey,
	insertBetween
} = require("./helper");
var classes = [
	{
		type: "symbol",
		toScript: function(obj) {
			let symbolDescription = String(obj).slice(7, -1);
			return `Symbol("${symbolDescription}")`;
		}
	},
	{
		type: Number,
		toScript: function(obj) {
			return `new Number(${JSON.stringify(obj)})`;
		}
	},
	{
		type: BigInt,
		toScript: function(obj) {
			return `Object(BigInt(${obj.valueOf().toString()}))`;
		}
	},
	{
		type: Boolean,
		toScript: function(obj) {
			return `new Boolean(${JSON.stringify(obj)})`;
		}
	},
	{
		type: String,
		toScript: function(obj) {
			this.ignoreProperties = ["length"];
			for (let i = 0; i < obj.length; ++i)
				if (obj.hasOwnProperty(i)) this.ignoreProperties.push(i.toString());
			return `new String(${JSON.stringify(obj)})`;
		}
	},
	{
		type: Symbol,
		toScript: function(obj, getScript, path) {
			return {
				init: [[]],
				add: [[path, "=", "Object(", ...getScript(obj.valueOf()), ")"]]
			};
		}
	},
	{
		type: Date,
		toScript: function(obj) {
			return `new Date(${obj.getTime()})`;
		}
	},
	{
		type: RegExp,
		toScript: function(obj) {
			this.ignoreProperties = getSameProperties(obj, obj.toString());
			return obj.toString();
		}
	},
	{
		type: Map,
		toScript: function(obj, getScript, path) {
			let mapContentArray = Array.from(obj);
			if (mapContentArray.length == 0) return "new Map()";
			return {
				init: ["new Map()"],
				add: [
					[
						...getScript(mapContentArray),
						".forEach(([k,v])=>{",
						path,
						".set(k,v);})"
					]
				]
			};
		}
	},
	{
		type: Set,
		toScript: function(obj, getScript, path) {
			let setContentArray = Array.from(obj);
			if (setContentArray.length == 0) return "new Set()";
			return {
				init: ["new Set()"],
				add: [
					[...getScript(setContentArray), ".forEach((v)=>{", path, ".add(v);})"]
				]
			};
		}
	},
	{
		type: Function,
		toScript: function(obj) {
			this.ignoreProperties = getSameProperties(obj, obj.toString());
			if (objectHasOnly(obj.prototype, { constructor: obj }))
				this.ignoreProperties.push("prototype");
			return obj.toString();
		}
	},
	{
		type: WeakSet,
		toScript: function(obj, getScript) {
			throw new TypeError("WeakSet cannot be scriptify!");
		}
	},
	{
		type: WeakMap,
		toScript: function(obj, getScript) {
			throw new TypeError("WeakMap cannot be scriptify!");
		}
	},
	{
		type: Array,
		toScript: function(obj, getScript, path) {
			var script = [[]];
			var lastIndex = -1;
			var scriptIndex = 0;
			obj.forEach((element, index) => {
				if (lastIndex != index - 1) {
					script[++scriptIndex] = `.length = ${index}`;
					script[++scriptIndex] = [];
				}
				let newPath = path.add(index.toString());
				newPath.initTime += scriptIndex;
				let elementScript = getScript(element, newPath);
				if (elementScript.length) script[scriptIndex].push(elementScript);
				else script[scriptIndex].push("null");
				lastIndex = index;
			});
			if (lastIndex + 1 < obj.length)
				script[++scriptIndex] = `.length = ${obj.length}`;

			var scriptArray = script.map((scriptText, index) => {
				if (index == 0)
					return [path, "=", "[", insertBetween(scriptText, ","), "]"];
				if (scriptText[0] == ".") return [path, scriptText];
				return [path, ".push(", insertBetween(scriptText, ","), ")"];
			});

			this.ignoreProperties = ["length"];
			obj.forEach((element, index) => {
				this.ignoreProperties.push(index.toString());
			});

			return {
				init: scriptArray
			};
		}
	},
	{
		// This item always must be at the end of the list
		type: "object",
		toScript: function(obj, getScript, path) {
			var entries = Object.entries(obj).filter(([key, value]) => {
				var descriptor = Object.getOwnPropertyDescriptor(obj, key);
				return descriptor.configurable && descriptor.writable;
			});
			var script = entries.map(([key, value]) => [
				key,
				getScript(value, path.add(key))
			]);

			this.ignoreProperties = entries.map(([key, valScript]) => key);

			let expression = [];

			script.forEach(([key, valScript]) => {
				valScript = insertBetween(valScript);
				if (valScript.length)
					expression.push(cleanKey(key), ":", ...valScript, ",");
			});
			expression.pop();
			return { init: [[path, "=", "{", ...expression, "}"]] };
		}
	}
];

var types = [
	{
		isTypeOf: obj => typeof obj == "bigint",
		toScript: function(obj) {
			return `BigInt(${obj.toString()})`;
		}
	},
	{
		isTypeOf: obj => Object.is(obj, null),
		toScript: function(obj) {
			return "null";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, undefined),
		toScript: function(obj) {
			return "undefined";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, NaN),
		toScript: function(obj) {
			return "NaN";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, Infinity),
		toScript: function(obj) {
			return "Infinity";
		}
	},
	{
		isTypeOf: obj => Object.is(obj, -Infinity),
		toScript: function(obj) {
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
