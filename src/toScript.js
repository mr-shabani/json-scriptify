var { objectHasOnly, isEmptyObject, addToPath } = require("./helper");
var classes = [
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
		toScript: function(obj, getScript) {
			let mapContentArray = Array.from(obj);
			if (mapContentArray.length == 0) return "new Map()";
			let mapContentArrayScript = getScript(mapContentArray);
			return {
				empty: "new Map()",
				add: varName =>
					`${mapContentArrayScript}.forEach(([k,v])=>{${varName}.set(k,v);})`
			};
		}
	},
	{
		type: Set,
		toScript: function(obj, getScript) {
			let setContentArray = Array.from(obj);
			if (setContentArray.length == 0) return "new Set()";
			let setContentArrayScript = getScript(setContentArray);
			return {
				empty: "new Set()",
				add: varName =>
					`${setContentArrayScript}.forEach((v)=>{${varName}.add(v);})`
			};
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
		type: Function,
		toScript: function(obj, getScript) {
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
		type: Array,
		toScript: function(obj, getScript, path) {
			var script = [];
			script[0] = "";
			var lastIndex = -1;
			var scriptIndex = 0;
			obj.forEach((element, index) => {
				if (lastIndex != index - 1) {
					const length = script[scriptIndex].length;
					if (script[scriptIndex][length - 1] == ",")
						script[scriptIndex] = script[scriptIndex].substr(
							0,
							script[scriptIndex].length - 1
						);
					script[++scriptIndex] = `.length = ${index}`;
					script[++scriptIndex] = "";
				}
				script[scriptIndex] +=
					getScript(element, addToPath(path, scriptIndex)) + ",";
				lastIndex = index;
			});
			const length = script[scriptIndex].length;
			if (script[scriptIndex][length - 1] == ",")
				script[scriptIndex] = script[scriptIndex].substr(
					0,
					script[scriptIndex].length - 1
				);
			if (lastIndex + 1 < obj.length)
				script[++scriptIndex] = `.length = ${obj.length}`;
			this.ignoreProperties = ["length"];
			obj.forEach((element, index) => {
				this.ignoreProperties.push(index.toString());
			});
			return {
				empty: "[]",
				add: script.map((scriptText, index) => {
					// if (index == 0) return `[${scriptText}]`;
					if(scriptText[0]=='.')
						return varName => varName + scriptText;
					return varName => `${varName}.push(${scriptText})`;
				})
			};
		}
	},
	{
		type: String,
		toScript: function(obj, getScript) {
			this.ignoreProperties = ["length"];
			for (let i = 0; i < obj.length; ++i)
				if (obj.hasOwnProperty(i)) this.ignoreProperties.push(i.toString());
			return `new String(${JSON.stringify(obj)})`;
		}
	},
	{
		type: Number,
		toScript: function(obj, getScript) {
			return `new Number(${JSON.stringify(obj)})`;
		}
	},
	{
		type: BigInt,
		toScript: function(obj, getScript) {
			return `Object(BigInt(${obj.valueOf().toString()}))`;
		}
	},
	{
		type: Boolean,
		toScript: function(obj, getScript) {
			return `new Boolean(${JSON.stringify(obj)})`;
		}
	},
	{
		type: "symbol",
		toScript: function(obj) {
			let symbolDescription = String(obj).slice(7, -1);
			return `Symbol("${symbolDescription}")`;
		}
	},
	{
		type: Symbol,
		toScript: function(obj, getScript) {
			return `Object(${getScript(obj.valueOf())})`;
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
	}
];

module.exports = { classes, types };
