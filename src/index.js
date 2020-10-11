var ScriptFromObject = require("./ScriptFromObject");

/**
 * return an script that can produce an object the same as input object
 * @param {any} obj 
 * @param {Object} options 
 * @returns {string}
 */
var scriptify = function(obj, options) {

	var scriptFromObject = new ScriptFromObject(obj);

	const script = scriptFromObject.export(options);

	return script;
};

module.exports = scriptify;
