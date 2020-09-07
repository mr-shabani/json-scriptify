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
	}
];

module.exports = classes;
