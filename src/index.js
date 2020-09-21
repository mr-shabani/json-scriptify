var ScriptFromObject = require("./ScriptFromObject");

var scriptify = function(obj, options) {

	var scriptFromObject = new ScriptFromObject(obj);

	const script = scriptFromObject.exportAsFunctionCall(options);

	return script;
};

// scriptify.withAllFunctions = function(obj) {
// 	return scriptify(obj, { withAllFunctions: true });
// };

module.exports = scriptify;
