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
			var entries = Object.entries(obj);
			if (entries.length == 0) return obj.toString();
			return {
				empty: obj.toString(),
				add: `${getScript(entries)}.forEach(([k,v])=>{${varName}[k]=v;})`
			};
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
