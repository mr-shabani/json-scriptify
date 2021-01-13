"use strict";
/**
 * simplify keys that only have numbers or alphabets with numbers
 * @param {string} keyText key
 */
const cleanKey = function(keyText) {
	if (
		String(parseInt(keyText)) == keyText &&
		keyText != "NaN" &&
		parseInt(keyText) >= 0
	)
		return parseInt(keyText);
	const alphabetCheckRegexp = /^[A-Za-z_]+[A-Za-z0-9_]*$/;
	if (alphabetCheckRegexp.test(keyText)) return keyText;
	return JSON.stringify(keyText);
};

/**
 * check that if typeof obj is equal to type(string) or obj is
 * instance of type(function) or instance of one function in type(Array).
 *
 * @param {(string|function|Array.<function>)} type
 * @param {*} obj
 */
const isInstanceOf = function(cls, obj) {
	if (cls.isTypeOf) return cls.isTypeOf(obj);
	const type = cls.type;
	if (typeof type == "string") return typeof obj == type;
	if (typeof type == "object" && type instanceof Array)
		return type.some(t => obj instanceof t);
	if (obj instanceof type) return true;
	return false;
};

const isEmptyObject = function(obj) {
	if (typeof obj != "object") return false;
	if (Object.is(obj, null)) return false;
	if (Object.getPrototypeOf(obj) !== Object.prototype) return false;
	if (Object.getOwnPropertyNames(obj).length > 0) return false;
	if (Object.getOwnPropertySymbols(obj).length > 0) return false;
	return true;
};
/**
 * check which properties will be the same in the two object.
 *
 * @param {Object} obj1
 * @param {Object} obj2
 *
 * @returns {string[]} keys that have same value
 */
const getSameProperties = function(obj1, obj2) {
	const descriptionProperties = [
		"value",
		"get",
		"set",
		"writable",
		"enumerable",
		"configurable"
	];
	const sameProperties = Object.getOwnPropertyNames(obj2)
		.concat(Object.getOwnPropertySymbols(obj2))
		.filter(key => {
			const objDesc2 = Object.getOwnPropertyDescriptor(obj2, key);
			const objDesc1 = Object.getOwnPropertyDescriptor(obj1, key);
			if (!objDesc2 || !objDesc1) return false;
			return descriptionProperties.every(
				prop =>
					objDesc2[prop] === objDesc1[prop] ||
					(isEmptyObject(objDesc2[prop]) && isEmptyObject(objDesc1[prop]))
			);
		});
	return sameProperties;
};
/**
 * check when script be evaluated which properties will be the same as original one(properties in obj).
 *
 * @param {Object} obj
 * @param {string} script script of obj
 *
 * @returns {string[]} keys that have same value in evaluated object and original obj
 */
const getSamePropertiesWhenEvaluated = function(obj, script) {
	const evaluate_script = new Function(`
			"use strict";
			var PleaseDoNotUseThisNameThatReservedForScriptifyModule = ${script}
			return PleaseDoNotUseThisNameThatReservedForScriptifyModule;
    `);
	const evaluated_obj = evaluate_script();
	return getSameProperties(obj, evaluated_obj);
};

/**
 * insert val between all element of arr.
 *
 * @param {Array} arr
 * @param {*} val
 * @returns {Array} new Array
 */
const insertBetween = function(arr, val) {
	const newArray = [];
	arr.forEach(element => {
		if (element instanceof Array) newArray.push(...insertBetween(element), val);
		else newArray.push(element, val);
	});
	newArray.pop();
	return newArray;
};

/**
 * innerObject class is a wrapper for an object that is not
 * part of the given object but is produced for making the script.
 * innerObject instance won't be passed to the replacer function.
 * For example: when we want to create object properties, we make
 * an array of [key, value]. This array is not part of the original
 * object and must not be passed to the replacer function.
 */
class InnerObject {
	constructor(obj, properties) {
		this.value = obj;
		if (properties) Object.assign(this, properties);
	}
	getReplacement() {
		return this.value;
	}
	isInCache() {
		return false;
	}
}

class FunctionWrapper extends InnerObject {
	constructor(obj, properties) {
		const thisFunction = function() {};
		thisFunction.value = obj;
		Object.setPrototypeOf(thisFunction, FunctionWrapper.prototype);
		if (properties) Object.assign(thisFunction, properties);
		return thisFunction;
	}
	getReplacement(replacer) {
		if (typeof replacer != "function") return this;
		const replacement = replacer(this.value);
		if (typeof replacement == "function") {
			this.value = replacement;
			return this;
		}
		return replacement;
	}
	isInCache(cache) {
		return cache.has(this.value);
	}
}

class HideKeysWrapper extends InnerObject {
	getReplacement(replacer) {
		if (typeof replacer != "function") return this;
		const replacement = replacer(this.value);
		if (typeof replacement == "object") this.value = replacement;
		return this;
	}
	isInCache(cache) {
		return cache.has(this.value);
	}
}

/**
 * make a proxy of obj that hide keys
 *
 * @param {Object} obj
 * @param {Array.<(string|symbol)>} keys list of keys that must be hide
 * @returns {Object} A Proxy of obj
 */
const hideKeys = function(obj, keys) {
	return new HideKeysWrapper(obj, { hiddenKeys: keys });
};

const isBigIntObject = function(obj) {
	if (typeof obj != "object") return false;
	try {
		BigInt.prototype.valueOf.call(obj);
	} catch (e) {
		return false;
	}
	return true;
};

module.exports = {
	isInstanceOf,
	getSameProperties,
	getSamePropertiesWhenEvaluated,
	cleanKey,
	insertBetween,
	hideKeys,
	InnerObject,
	isBigIntObject,
	FunctionWrapper
};
