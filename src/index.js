var objectSet = new Set();
var { traverse, definitionList } = require("./helper");

var replacer = function(key, value) {
	if (typeof value == "object") {
		if (objectSet.has(value)) {
			return;
		}
		objectSet.add(value);
	}
	return value;
};

var scriptify = function(obj, options) {
	options = options || {};
	
	objectSet.clear();

    traverse(obj, "obj");

	var str = "(function(){\n//version 1\n";
	str +=
		"  var obj = " + JSON.stringify(obj, replacer) + ";\n//Circular references";
	definitionList.circularReferences.forEach(([path, reference]) => {
		str += "\n" + "  " + path + " = " + reference + ";";
    });

	if (options.withAllFunctions) {
		str += "\n//Functions";
		definitionList.functionList.forEach(([path, code]) => {
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
