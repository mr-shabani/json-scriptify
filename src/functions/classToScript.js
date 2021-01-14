"use strict";
/**
 * give a class object and make a script for that.
 */

const tokenize = require("./tokenize");

const { ExpressionClass } = require("../ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const makeResultOfExpression = require("./makeResultOfExpression");

const variableNameRegexp = "[a-zA-Z_]+\\w*";
const classNameRegexp = `^class\\s+(?<className>${variableNameRegexp})`;
let classWithParentNameRegexp = `${classNameRegexp}(?:\\s+extends\\s+(?<parentName>.+))*`;
classWithParentNameRegexp = new RegExp(classWithParentNameRegexp);

const defaultParentName = "p";

/**
 * Analyze class string code to find the parent name of the class if exist.
 * parent name may be a complex expression. If parent name expression only
 * includes membership expressions, we reconstruct it. but for more complex
 * expressions we change the code and replace the parent name with name 'p'.
 *
 * @param {string} code is toString of class object
 * @returns {[string, function, (string|ExpressionClass)] }
 */
const classExpressionAnalyze = function(code) {
	const tokenIndexesMap = tokenize(code, ["}"]);
	const classBodyLastIndex = code.lastIndexOf("}");
	const classBodyFirstIndex = tokenIndexesMap.get(classBodyLastIndex);
	let { parentName: parentNameExpression } = code
		.substr(0, classBodyFirstIndex)
		.match(classWithParentNameRegexp).groups;
	let parentScriptConstructor = null;
	if (parentNameExpression) {
		const parentNameIndex = classBodyFirstIndex - parentNameExpression.length;
		parentNameExpression = parentNameExpression.trim();
		parentScriptConstructor = makeResultOfExpression(parentNameExpression);
		if (!parentScriptConstructor) {
			// When parent name expression is complex :
			code =
				code.substring(0, parentNameIndex) +
				defaultParentName +
				code.substring(classBodyFirstIndex - 1);
			parentScriptConstructor = makeResultOfExpression(defaultParentName);
		}
	}
	return [parentNameExpression, parentScriptConstructor, code];
};

/**
 * class type define
 * @typedef {function} class
 * @class
 */

/**
 * make script of class object
 *
 * @param {class} obj
 * @param {function} getScript
 * @param {ClassPath} path
 * @returns {Array.<(ExpressionClass|String|ScriptClass)>}
 */
const classToScript = function(obj, getScript, path) {
	const classCode = Function.prototype.toString.call(obj);
	const [parentNameExpression, parentConstructor, code] = classExpressionAnalyze(
		classCode
	);
	const scriptArray = [];
	if (parentConstructor) {
		let parentClassPath = path.add("__proto__");
		let parentScript = getScript(obj.__proto__, parentClassPath);
		let parentInitScript = parentScript.popInit();
		if (parentInitScript.isEmpty()) {
			scriptArray.push(makeExpression());
			parentInitScript = parentScript.popInit();
		}
		if (
			typeof parentInitScript.hasDeterminateString == "function" &&
			parentInitScript.hasDeterminateString() &&
			parentNameExpression == parentInitScript.toString()
		) {
			// parentNameExpression is a predefined value
			scriptArray.push(
				`(function(){\n return ${classCode};\n })()`,
				parentScript
			);
		} else {
			let constructorScript = makeExpression(
				path,
				"=",
				parentConstructor(code, parentInitScript)
			);
			scriptArray.push(constructorScript, parentScript);
		}
	} else scriptArray.push(`(function(){\n  return ${classCode};\n })()`);
	return scriptArray;
};

module.exports = classToScript;
