var addToPath = function(path, key) {
	const alphabetCheckRegexp = /^[A-Za-z_]+$/;
	if (String(parseInt(key)) == key && key != "NaN")
		return path + "[" + parseInt(key) + "]";
	if (alphabetCheckRegexp.test(key)) return path + "." + key;
	return path + "[" + JSON.stringify(key) + "]";
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
var objectHasOnly = function(obj, props) {
	if (typeof obj != "object") return false;
	if (Object.is(obj, null)) return false;
	if (obj.__proto__ !== Object.prototype) return false;
	if (Object.getOwnPropertyNames(obj).some(key => obj[key] != props[key]))
		return false;
	if (Object.getOwnPropertySymbols(obj).some(key => obj[key] != props[key]))
		return false;
	return true;
};

module.exports = { addToPath, isInstanceOf, isEmptyObject, objectHasOnly };
