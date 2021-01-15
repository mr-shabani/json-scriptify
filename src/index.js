"use strict";
const ScriptClass = require("./ScriptClass");
const { ignoreSomeProps } = require("./utility");
/**
 * @typedef {Object} Options
 * @property {Array.<[string,any]>} [predefined]
 * @property {string} [lineBreak]
 */
/**
 * return an script that can produce an object the same as input object
 * @param {any} obj
 * @param {function(any):any} Replacer
 * @param {Options} options
 * @returns {string}
 */
const scriptify = function(obj, Replacer, options) {
	options = options || {};
	options.lineBreak =
		typeof options.lineBreak == "string" ? options.lineBreak : "\n ";
	options.replacer = Replacer;
	const scriptClass = new ScriptClass(options);

	scriptClass.buildExpressionsOf(obj);

	const script = scriptClass.export();

	return script;
};

scriptify.ignore = ScriptClass.ignoreSymbol;
scriptify.ignoreSomeProps = ignoreSomeProps;

module.exports = scriptify;
