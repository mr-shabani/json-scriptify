var classesToScript = require("./toScript");

var traverse = function(obj, path) {
	mark = arguments[2];
	expressionList = arguments[3];
	if (!mark) {
		var mark = new Map();
		var expressionList = {};
		expressionList.circularReferences = [];
		expressionList.functionsList = [];
		expressionList.objectConstructors = [];
	}

	if (typeof obj == "function") {
		expressionList.functionsList.push([path, obj.toString()]);
		return expressionList;
	}
	if (typeof obj == "bigint") {
		expressionList.objectConstructors.push([path, `BigInt(${obj.toString()})`]);
		return expressionList;
	}

	if (typeof obj != "object") return expressionList;

	if (mark.has(obj)) {
		expressionList.circularReferences.push([path, mark.get(obj)]);
		return expressionList;
	}

	for (let cls of classesToScript) {
		if (obj instanceof cls.type) {
			var replacement = cls.toScript(obj);
			if (typeof replacement == "string") {
				expressionList.objectConstructors.push([path, replacement]);
				return expressionList;
			}
		}
	}

	mark.set(obj, path);
	Object.entries(obj).forEach(([key, value]) => {
		traverse(
			value,
			path + "[" + JSON.stringify(key) + "]",
			mark,
			expressionList
		);
	});
	return expressionList;
};

module.exports = { traverse };
