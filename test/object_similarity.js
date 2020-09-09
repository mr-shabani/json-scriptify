var classToPlainObject = require("./classToPlainObject");
var typesSimilarityCheck = require("./typesSimilarityCheck");

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

	if (mark.has(obj1)) return mark.get(obj1) == obj2;

	mark.set(obj1, obj2);

	if (typeof obj1 == "symbol" || typeof obj2 == "symbol") {
		if (typeof obj1 == "symbol" && typeof obj2 == "symbol") {
			return String(obj1) == String(obj2);
		}
		return false;
	}

	for (let cls of classToPlainObject) {
		if (obj1 instanceof cls.type || obj2 instanceof cls.type) {
			if (!(obj1 instanceof cls.type && obj2 instanceof cls.type)) {
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
		if(!descriptor2.hasOwnProperty(key)){
			returnValue = false;
			return;
		}
		returnValue =
			descriptor1[key].writable == descriptor2[key].writable &&
			descriptor1[key].configurable == descriptor2[key].configurable &&
			descriptor1[key].enumerable == descriptor2[key].enumerable;
		returnValue = returnValue && checkSimilarity(
			descriptor1[key].value,
			descriptor2[key].value,
			mark
		);
	});
	Object.getOwnPropertySymbols(descriptor1).forEach(key => {
		if (!returnValue) return;
		if(!descriptor2.hasOwnProperty(key)){
			returnValue = false;
			return;
		}
		returnValue =
			descriptor1[key].writable == descriptor2[key].writable &&
			descriptor1[key].configurable == descriptor2[key].configurable &&
			descriptor1[key].enumerable == descriptor2[key].enumerable;
		returnValue = returnValue && checkSimilarity(
			descriptor1[key].value,
			descriptor2[key].value,
			mark
		);
	});
	return returnValue;
};

var twoSidedSimilarity = function(obj1, obj2) {
	return checkSimilarity(obj1, obj2) && checkSimilarity(obj2, obj1);
};

module.exports = twoSidedSimilarity;
