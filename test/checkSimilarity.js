const classToPlainObject = require("./classToPlainObject");
const typesSimilarityCheck = require("./typesSimilarityCheck");
const { isInstanceOf } = require("../src/utility");

const checkSimilarity = function(obj1, obj2) {
	const cache = arguments[2] || new Map();

	for (let type of typesSimilarityCheck) {
		if (type.mustCheck(obj1, obj2)) {
			if (type.isSimilar(obj1, obj2)) return true;
			// console.log("diff in types : ", obj1, obj2);
			return false;
		}
	}

	const typesThatWillBeCheckedLater = ["object", "function", "symbol"];
	if (
		!typesThatWillBeCheckedLater.includes(typeof obj1) ||
		!typesThatWillBeCheckedLater.includes(typeof obj2)
	) {
		if (obj1 === obj2) return true;
		// console.log("diff in other types : ", obj1, obj2);
		return false;
	}

	if (cache.has(obj1)) {
		if (cache.get(obj1) == obj2) return true;
		// console.log("diff in cached items : ", obj1, obj2);
		return false;
	}

	cache.set(obj1, obj2);

	// console.log("check for : ",obj1, obj2);

	for (let cls of classToPlainObject) {
		if (isInstanceOf(cls, obj1) || isInstanceOf(cls, obj2)) {
			if (isInstanceOf(cls, obj1) != isInstanceOf(cls, obj2)) {
				// console.log("diff in prototype : ",cls.type);
				return false;
			}
			if (
				checkSimilarity(
					[cls.toPlainObject(obj1), Object.getOwnPropertyDescriptors(obj1)],
					[cls.toPlainObject(obj2), Object.getOwnPropertyDescriptors(obj2)],
					cache
				)
			)
				return true;
			// console.log("diff in class : ",cls.type);
			return false;
		}
	}

	const descriptor1 = Object.getOwnPropertyDescriptors(obj1);
	const descriptor2 = Object.getOwnPropertyDescriptors(obj2);
	const returnValue = Object.getOwnPropertyNames(descriptor1).every(key => {
		if (!Object.prototype.hasOwnProperty.call(descriptor2, key)) {
			// console.log("obj2 has not key : ",key,obj1,obj2);
			return false;
		}

		const descProps = ["writable", "configurable", "enumerable"];
		if (
			descProps.some(prop => descriptor1[key][prop] != descriptor2[key][prop])
		) {
			// console.log("diff in description props : ",key);
			return false;
		}

		const descValueProps = ["value", "get", "set"];
		if (
			descValueProps.every(prop =>
				checkSimilarity(descriptor1[key][prop], descriptor2[key][prop], cache)
			)
		)
			return true;
		// console.log("diff in description value props : ",key);
		return false;
	});
	if (!returnValue) return false;

	const symbolKeys1 = Object.getOwnPropertySymbols(descriptor1).sort();
	const symbolKeys2 = Object.getOwnPropertySymbols(descriptor2).sort();

	return symbolKeys1.every((key, index) => {
		/* this method works correctly with only one symbol key.
		 * but for more symbol keys we only can sort keys to increase
		 * the chance of correctness
		 */
		const key2 = symbolKeys2[index];
		if (
			checkSimilarity([key, descriptor1[key]], [key2, descriptor2[key2]], cache)
		)
			return true;
		// console.log("diff in symbol key : ",key);
		return false;
	});
};

const twoSidedSimilarity = function(obj1, obj2) {
	return checkSimilarity(obj1, obj2) && checkSimilarity(obj2, obj1);
};

module.exports = twoSidedSimilarity;
