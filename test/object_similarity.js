var classToPlainObject = require("./classToPlainObject");
var typesSimilarityCheck = require("./typesSimilarityCheck");
var { isInstanceOf } = require("../src/helper");

var checkSimilarity = function(obj1, obj2) {
	var mark = arguments[2] || new Map();

	for (let type of typesSimilarityCheck) {
		if (type.mustCheck(obj1, obj2)) {
			return type.isSimilar(obj1, obj2);
		}
	}

	typesThatWillBeCheckedLater = ["object", "function", "symbol"];
	if (
		!typesThatWillBeCheckedLater.includes(typeof obj1) ||
		!typesThatWillBeCheckedLater.includes(typeof obj2)
	)
		return obj1 == obj2;

	if (mark.has(obj1)) return mark.get(obj1) === obj2;

	mark.set(obj1, obj2);

	for (let cls of classToPlainObject) {
		if (isInstanceOf(cls.type, obj1) || isInstanceOf(cls.type, obj2)) {
			if (!(isInstanceOf(cls.type, obj1) && isInstanceOf(cls.type, obj2))) {
				return false;
			}
			return checkSimilarity(
				[cls.toPlainObject(obj1), Object.getOwnPropertyDescriptors(obj1)],
				[cls.toPlainObject(obj2), Object.getOwnPropertyDescriptors(obj2)],
				mark
			);
		}
	}

	var returnValue = true;
	var descriptor1 = Object.getOwnPropertyDescriptors(obj1);
	var descriptor2 = Object.getOwnPropertyDescriptors(obj2);
	Object.getOwnPropertyNames(descriptor1).forEach(key => {
		if (!returnValue) return;
		if (!descriptor2.hasOwnProperty(key)) {
			returnValue = false;
			return;
		}
		returnValue =
			descriptor1[key].writable == descriptor2[key].writable &&
			descriptor1[key].configurable == descriptor2[key].configurable &&
			descriptor1[key].enumerable == descriptor2[key].enumerable;
		returnValue =
			returnValue &&
			checkSimilarity(descriptor1[key].value, descriptor2[key].value, mark);
	});
	var symbolKeys1 = Object.getOwnPropertySymbols(descriptor1);
	var symbolKeys2 = Object.getOwnPropertySymbols(descriptor2);
	symbolKeys1.forEach((key, index) => {
		if (!returnValue) return;
		var key2 = symbolKeys2[index];
		returnValue =
			returnValue &&
			checkSimilarity([key, descriptor1[key]], [key2, descriptor2[key2]], mark);
	});
	return returnValue;
};

var twoSidedSimilarity = function(obj1, obj2) {
	return checkSimilarity(obj1, obj2) && checkSimilarity(obj2, obj1);
};

module.exports = twoSidedSimilarity;
