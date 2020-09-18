var { objectHasOnly, isEmptyObject, cleanKey } = require("./helper");
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
		toScript: function(obj, getScript,path) {
			let symbolVariable = getScript(obj.valueOf());
			return [[path,"=Object(", symbolVariable, ")"]];
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
			return obj.toString();
		}
	},
	{
		type: Map,
		toScript: function(obj, getScript, path) {
			let mapContentArray = Array.from(obj);
			if (mapContentArray.length == 0) return "new Map()";
			let mapContentArrayScript = getScript(mapContentArray);
			return {
				empty: "new Map()",
				add: [
					[mapContentArrayScript, ".forEach(([k,v])=>{", path, ".set(k,v);})"]
				]
			};
		}
	},
	{
		type: Set,
		toScript: function(obj, getScript, path) {
			let setContentArray = Array.from(obj);
			if (setContentArray.length == 0) return "new Set()";
			let setContentArrayScript = getScript(setContentArray);
			return {
				empty: "new Set()",
				add: [[setContentArrayScript, ".forEach((v)=>{", path, ".add(v);})"]]
			};
		}
	},
	{
		type: Function,
		toScript: function(obj) {
			eval(`
			var PleaseDoNotUseThisNameThatReservedForScriptifyModule = ${obj.toString()}
			`);
			const f = PleaseDoNotUseThisNameThatReservedForScriptifyModule;
			this.ignoreProperties = Object.getOwnPropertyNames(f).filter(key => {
				if (!(isEmptyObject(obj[key]) && isEmptyObject(f[key]))) {
					if (obj[key] !== f[key] && !Object.is(f[key], obj[key])) return false;
				}
				let descriptor_f = Object.getOwnPropertyDescriptor(f, key);
				let descriptor_obj = Object.getOwnPropertyDescriptor(obj, key);
				return (
					descriptor_f.writable == descriptor_obj.writable &&
					descriptor_f.configurable == descriptor_obj.configurable &&
					descriptor_f.enumerable == descriptor_obj.enumerable
				);
			});
			if (
				objectHasOnly(obj.prototype, { constructor: obj }) &&
				objectHasOnly(f.prototype, { constructor: f })
			)
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
				script[scriptIndex].push(getScript(element, path));
				lastIndex = index;
			});

			if (lastIndex + 1 < obj.length)
				script[++scriptIndex] = `.length = ${obj.length}`;

			var hasNotSelfLoop = path.circularCitedChild ? false : true;
			var scriptArray = script.map((scriptText, index) => {
				if (index == 0 && hasNotSelfLoop) return [path,'=[',scriptText.join(","),']'];
				if (scriptText[0] == ".") return [path, scriptText];
				let expression = [];
				scriptText.forEach(x => {
					expression.push(x, ",");
				});
				expression.pop();
				return [path, ".push(", ...expression, ")"];
			});

			this.ignoreProperties = ["length"];
			obj.forEach((element, index) => {
				this.ignoreProperties.push(index.toString());
			});

			if (hasNotSelfLoop) return scriptArray;
			return {
				empty: "[]",
				add: scriptArray
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
			var script = entries.map(([key, value]) => [key, getScript(value, path)]);

			var hasNotSelfLoop = path.circularCitedChild ? false : true;

			this.ignoreProperties = entries.map(([key, value]) => key);

			let expression = [];

			if (hasNotSelfLoop) {
				script.forEach(([key, val]) => {
					expression.push(cleanKey(key), ":", val, ",");
				});
				expression.pop();
				return [[path, "={", ...expression, "}"]];
			}
			script.forEach(([key, val]) => {
				expression.push("[", JSON.stringify(key), ",", val, "]", ",");
			});
			expression.pop();
			return {
				empty: "{}",
				add: [["[", ...expression, "].forEach(([k,v])=>{", path, "[k]=v;})"]]
			};
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
