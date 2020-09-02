var classToPlainObject = require("./classToPlainObject");

var checkSimilarity = function(obj1, obj2, ignoreFunctions) {
	var mark = arguments[3] || new Map();

	if (typeof obj1 != "object" || typeof obj2 != "object") {
		if (typeof obj1 == "function" && typeof obj2 == "function") {
			if (ignoreFunctions) return true;
			return obj1.toString() == obj2.toString();
		}
		return obj1 == obj2;
	}

	if (mark.has(obj1)) return mark.get(obj1) == obj2;

	mark.set(obj1, obj2);

	for (let cls of classToPlainObject) {
		if (obj1 instanceof cls.type || obj2 instanceof cls.type) {
			if (!(obj1 instanceof cls.type && obj2 instanceof cls.type)) {
				return false;
			}
			return checkSimilarity(
				cls.toPlainObject(obj1),
				cls.toPlainObject(obj2),
				ignoreFunctions,
				mark
			);
		}
	}

	var returnValue = true;
	Object.entries(obj1).forEach(([key, value]) => {
		if (returnValue)
			returnValue =
				returnValue && checkSimilarity(value, obj2[key], ignoreFunctions, mark);
	});
	return returnValue;
};

module.exports = checkSimilarity;
