var classToPlainObject = require("./classToPlainObject");
var typesSimilarityCheck = require("./typesSimilarityCheck");

var checkSimilarity = function(obj1, obj2) {
	var mark = arguments[2] || new Map();

	for (let type of typesSimilarityCheck) {
		if (type.mustCheck(obj1, obj2)) {
			return type.isSimilar(obj1, obj2);
		}
	}

	typesThatWillBeCheckedLater = ["object", "function"];
	if (
		!typesThatWillBeCheckedLater.includes(typeof obj1) ||
		!typesThatWillBeCheckedLater.includes(typeof obj2)
	)
		return obj1 == obj2;

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
				mark
			);
		}
	}

	var returnValue = true;
	Object.entries(obj1).forEach(([key, value]) => {
		if (returnValue)
			returnValue =
				returnValue && checkSimilarity(value, obj2[key], mark);
	});
	return returnValue;
};

var twoSidedSimilarity = function(obj1, obj2) {
	return checkSimilarity(obj1, obj2) && checkSimilarity(obj2, obj1);
};

module.exports = twoSidedSimilarity;
