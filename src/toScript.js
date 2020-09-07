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
		toScript: function(obj, getScript, varName) {
			return {
				empty: `new Map()`,
				add: `${getScript(
					Array.from(obj)
				)}.forEach(([k,v])=>{${varName}.set(k,v);})`
			};
		}
	},
	{
		type: Set,
		toScript: function(obj, getScript, varName) {
			return {
				empty: `new Set()`,
				add: `${getScript(Array.from(obj))}.forEach((v)=>{${varName}.add(v);})`
			};
		}
	},
	{
		type: WeakSet,
		toScript: function(obj, getScript, varName) {
			throw new TypeError("WeakSet cannot be scriptify!");
		}
	},
	{
		type: WeakMap,
		toScript: function(obj, getScript, varName) {
			throw new TypeError("WeakMap cannot be scriptify!");
		}
	},
	{
		type: Function,
		toScript: function(obj, getScript, varName) {
			return obj.toString();
		}
	},
	{
		type: Array,
		toScript: function(obj, getScript, varName) {
			return;
		}
	},
	{
		type: String,
		toScript: function(obj, getScript, varName) {
			return `new String(${JSON.stringify(obj)})`;
		}
	},
	{
		type: Number,
		toScript: function(obj, getScript, varName) {
			return `new Number(${JSON.stringify(obj)})`;
		}
	},
	{
		type: Boolean,
		toScript: function(obj, getScript, varName) {
			return `new Boolean(${JSON.stringify(obj)})`;
		}
	}
];

var types = [
	{
		is: obj => typeof obj == "bigint",
		toScript: function(obj) {
			return `BigInt(${obj.toString()})`;
		}
	},
	{
		is: obj => Object.is(obj, null),
		toScript: function(obj) {
			return "null";
		}
	},
	{
		is: obj => Object.is(obj, undefined),
		toScript: function(obj) {
			return "undefined";
		}
	},
	{
		is: obj => Object.is(obj, NaN),
		toScript: function(obj) {
			return "NaN";
		}
	},
	{
		is: obj => Object.is(obj, Infinity),
		toScript: function(obj) {
			return "Infinity";
		}
	},
	{
		is: obj => Object.is(obj, -Infinity),
		toScript: function(obj) {
			return "-Infinity";
		}
	}
];

module.exports = { classes, types };
