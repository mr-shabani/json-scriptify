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
			throw new TypeError("WeakSet cannot be scriptify!")
		}
	},
	{
		type: WeakMap,
		toScript: function(obj, getScript, varName) {
			throw new TypeError("WeakMap cannot be scriptify!")
		}
	}
];

module.exports = classes;
