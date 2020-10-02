var ScriptFromObject = require("./ScriptFromObject");

var scriptify = function(obj, options) {

	var scriptFromObject = new ScriptFromObject(obj);

	const script = scriptFromObject.export(options);

	return script;
};

module.exports = scriptify;
