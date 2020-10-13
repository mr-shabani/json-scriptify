var ScriptFromObject = require("./ScriptFromObject");

/**
 * return an script that can produce an object the same as input object
 * @param {any} obj
 * @param {function(any):any} Replacer
 * @param {Object} options
 * @returns {string}
 */
var scriptify = function(obj, Replacer, options) {
	options = options || {};
	options.replacer = Replacer;
	var scriptFromObject = new ScriptFromObject(obj,undefined,undefined,options);

	const script = scriptFromObject.export(options);

	return script;
};

module.exports = scriptify;
