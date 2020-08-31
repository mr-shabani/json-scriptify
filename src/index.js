var objectSet = new Set();
var { traverse } = require("./helper");
var classesToScript = require("./toScript")

var replacer = function(key, value) {
	if (typeof value == "object") {
		if (objectSet.has(value)) {
			return;
		}
		objectSet.add(value);
	}
	if (typeof value == "bigint") return;
	for (let cls of classesToScript) {
		if (value instanceof cls.type) return;
	}
	return value;
};

var scriptify = function(obj, options) {
	options = options || {};

	objectSet.clear();

	expressionList = traverse(obj, "obj");

	var str = "(function(){\n//version 1\n";
	str += "  var obj = " + JSON.stringify(obj, replacer) + ";";

	str += "\n//Circular references";
	expressionList.circularReferences.forEach(([path, reference]) => {
		str += "\n" + "  " + path + " = " + reference + ";";
	});

	str += "\n//Object constructors";
	expressionList.objectConstructors.forEach(([path, code, addExpression]) => {
		if (addExpression) str += `\n ${path} = ${code}; ${path}${addExpression}`;
		else str += `\n ${path} = ${code};`;
	});

	if (options.withAllFunctions) {
		str += "\n//Functions";
		expressionList.functionsList.forEach(([path, code]) => {
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
