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
			return obj.toString();
		}
	},
	{
		type: Array,
		toScript: function(obj, getScript) {
			return;
		}
	},
	{
		type: String,
		toScript: function(obj, getScript) {
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
