classes = [
	{
		type: RegExp,
		toPlainObject: function(regexp){
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
		toPlainObject: function(set){
			return Array.from(set).sort();
		}
	}
];

module.exports = classes;