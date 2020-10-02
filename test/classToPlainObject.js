classes = [
	{
		type: Date,
		toPlainObject: function(date) {
			return date.getTime();
		}
	},
	{
		type: RegExp,
		toPlainObject: function(regexp) {
			return regexp.toString();
		}
	},
	{
		type: Map,
		toPlainObject: function(map) {
			return Array.from(map);
		}
	},
	{
		type: Set,
		toPlainObject: function(set) {
			return Array.from(set).sort();
		}
	},
	{
		type: Function,
		toPlainObject: function(func) {
			return func.toString();
		}
	},
	{
		type: Symbol,
		toPlainObject: function(sym) {
			return sym.valueOf();
		}
	},
	{
		type: Object.getPrototypeOf(Int8Array),// TypedArray class
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
		toPlainObject: function(dataView) {
			return [
				dataView.buffer,
				dataView.byteOffset,
				dataView.length,
			];
		}
	},
	{
		type: ArrayBuffer,
		toPlainObject: function(buff) {
			return Array.from(new Uint8Array(buff));
		}
	}
];

module.exports = classes;
