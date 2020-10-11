var PathClass = require("./PathClass");
var { makeFlat, ExpressionClass } = require("./ExpressionClass");
var classToScript = require("./classToScript");

/**
 * simplify keys that only have numbers or alphabets with numbers
 * @param {string} keyText key
 */
var cleanKey = function(keyText) {
	if (String(parseInt(keyText)) == keyText && keyText != "NaN")
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
 * @param {} obj
 */
var isInstanceOf = function(type, obj) {
	if (typeof type == "string") return typeof obj == type;
	if (typeof type == "object" && type instanceof Array)
		return type.some(t => obj instanceof t);
	if (obj instanceof type) return true;
	return false;
};
var isEmptyObject = function(obj) {
	if (typeof obj != "object") return false;
	if (Object.is(obj, null)) return false;
	if (obj.__proto__ !== Object.prototype) return false;
	if (Object.getOwnPropertyNames(obj).length > 0) return false;
	if (Object.getOwnPropertySymbols(obj).length > 0) return false;
	return true;
};
/**
 * check that obj2 have all properties of obj1.
 *
 * @param {Object} obj1 main object
 * @param {Object} obj2
 */
var objectIsSame = function(obj1, obj2) {
	if (typeof obj1 != "object") return false;
	if (Object.is(obj1, null)) return false;
	if (obj1.__proto__ !== obj2.__proto__) return false;
	if (Object.getOwnPropertyNames(obj1).some(key => obj1[key] != obj2[key]))
		return false;
	if (Object.getOwnPropertySymbols(obj1).some(key => obj1[key] != obj2[key]))
		return false;
	return true;
};

/**
 * check when script evaluated witch properties will be as same as original one(obj).
 *
 * @param {Object} obj
 * @param {string} script script of obj
 *
 * @returns {string[]} keys that have a same value
 */
var getSameProperties = function(obj, script) {
	eval(`
			var PleaseDoNotUseThisNameThatReservedForScriptifyModule = ${script}
			`);
	// eslint-disable-next-line no-undef
	const evaluated_obj = PleaseDoNotUseThisNameThatReservedForScriptifyModule;
	var sameProperties = Object.getOwnPropertyNames(evaluated_obj).filter(key => {
		if (["caller", "callee", "arguments"].includes(key)) return false; // for 'use strict' mode
		if (!(isEmptyObject(obj[key]) && isEmptyObject(evaluated_obj[key]))) {
			if (
				obj[key] !== evaluated_obj[key] &&
				!Object.is(evaluated_obj[key], obj[key])
			)
				return false;
		}
		let descriptor_evalObj = Object.getOwnPropertyDescriptor(
			evaluated_obj,
			key
		);
		let descriptor_obj = Object.getOwnPropertyDescriptor(obj, key);
		return (
			descriptor_evalObj.writable == descriptor_obj.writable &&
			descriptor_evalObj.configurable == descriptor_obj.configurable &&
			descriptor_evalObj.enumerable == descriptor_obj.enumerable
		);
	});
	return sameProperties;
};

/**
 * insert val between all element of arr.
 *
 * @param {Array} arr
 * @param {} val
 * @returns {Array} new Array
 */
var insertBetween = function(arr, val) {
	let newArray = [];
	arr.forEach(element => {
		if (element instanceof Array) newArray.push(...insertBetween(element), val);
		else newArray.push(element, val);
	});
	newArray.pop();
	return newArray;
};

/**
 * make a proxy of obj that hide keys
 * 
 * @param {Object} obj 
 * @param {Array.<(string|symbol)>} keys list of keys that must be hide
 * @returns {Object} A Proxy of obj
 */
var hideKeys = function(obj, keys) {
	let handler = {
		get: function(target, key) {
			if (keys.includes(key)) return undefined;
			return Reflect.get(...arguments);
		},
		ownKeys: function() {
			return Reflect.ownKeys(...arguments).filter(key => !keys.includes(key));
		}
	};
	return new Proxy(obj, handler);
};

module.exports = {
	isInstanceOf,
	getSameProperties,
	objectIsSame,
	PathClass,
	cleanKey,
	insertBetween,
	makeFlat,
	ExpressionClass,
	classToScript,
	hideKeys
};
