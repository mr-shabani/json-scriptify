var objectSet = new Set();
var { traverse, definitionList } = require("./helper");

var replacer = function(key, value) {
	if (typeof value == "object") {
		if (objectSet.has(value)) {
			return;
		}
		objectSet.add(value);
	}
	if(typeof value == "bigint")
		return;
	return value;
};

var scriptify = function(obj, options) {
	options = options || {};

	objectSet.clear();

	traverse(obj, "obj");

	var str = "(function(){\n//version 1\n";
	str += "  var obj = " + JSON.stringify(obj, replacer) + ";";

	str += "\n//Circular references";
	definitionList.circularReferences.forEach(([path, reference]) => {
		str += "\n" + "  " + path + " = " + reference + ";";
	});

	str += "\n//Object constructors";
	definitionList.objectConstructors.forEach(([path, code]) => {
		str += "\n" + "  " + path + " = " + code + ";";
	});

	if (options.withAllFunctions) {
		str += "\n//Functions";
		definitionList.functionsList.forEach(([path, code]) => {
			str += "\n" + "  " + path + " = " + code + ";";
		});
	}
	str += "\n  return obj;\n})()";
	return str;
};

scriptify.withAllFunctions = function(obj) {
	return scriptify(obj, { withAllFunctions: true });
};

module.exports = scriptify;
