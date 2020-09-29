var PathClass = require("./PathClass");
var { makeFlat, ExpressionClass } = require("./ExpressionClass");
var classToScript = require("./classToScript");

var cleanKey = function(keyText) {
	if (String(parseInt(keyText)) == keyText && keyText != "NaN")
		return parseInt(keyText);
	const alphabetCheckRegexp = /^[A-Za-z_]+[A-Za-z0-9_]*$/;
	if (alphabetCheckRegexp.test(keyText)) return keyText;
	return JSON.stringify(keyText);
};

var isInstanceOf = function(type, obj) {
	if (typeof type == "string") return typeof obj == type;
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
var objectIsSame = function(obj, props) {
	if (typeof obj != "object") return false;
	if (Object.is(obj, null)) return false;
	if (obj.__proto__ !== props.__proto__) return false;
	if (Object.getOwnPropertyNames(obj).some(key => obj[key] != props[key]))
		return false;
	if (Object.getOwnPropertySymbols(obj).some(key => obj[key] != props[key]))
		return false;
	return true;
};

var getSameProperties = function(obj, script) {
	eval(`
			var PleaseDoNotUseThisNameThatReservedForScriptifyModule = ${script}
			`);
	const evaluated_obj = PleaseDoNotUseThisNameThatReservedForScriptifyModule;
	var sameProperties = Object.getOwnPropertyNames(evaluated_obj).filter(key => {
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

var insertBetween = function(arr, val) {
	let newArray = [];
	if (arguments.length == 2) {
		arr.forEach(element => {
			if (element instanceof Array)
				newArray.push(...insertBetween(element), val);
			else newArray.push(element, val);
		});
		newArray.pop();
	} else {
		arr.forEach(element => {
			if (element instanceof Array) newArray.push(...insertBetween(element));
			else newArray.push(element);
		});
	}
	return newArray;
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
	classToScript
};
