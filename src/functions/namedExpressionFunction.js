"use strict";
/**
 * give a function that has an expression name as '[/*some expression/*]'
 * and make a script for that.
 */

const tokenize = require("./tokenize");

const { ExpressionClass } = require("../ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const makeResultOfExpression = require("./makeResultOfExpression");

/**
 * Analyze function string code to find the expression name.
 * expression name may be a complex expression. If expression name only
 * includes membership expressions, we reconstruct it. but for more complex
 * expressions we change the code and replace the expression name with function.name .
 *
 * @param {function} obj is toString of class object
 * @param {Object} funcData
 * @returns {Array.<{name:string|PathClass|ExpressionClass,  code: string|ExpressionClass}> }
 */
const functionNameExpressionChanger = function(obj, funcData) {
	let code = Function.prototype.toString.call(obj);
	const tokenIndexesMap = tokenize(code, ["["]);
	const nameExpFirstIndex = code.indexOf("[");
	const nameExpLastIndex = tokenIndexesMap.get(nameExpFirstIndex);
	const nameExpression = code.substring(
		nameExpFirstIndex + 1,
		nameExpLastIndex
	);

	if (
		typeof funcData.key == "object" &&
		"hasDeterminateString" in funcData.key &&
		funcData.key.hasDeterminateString()
	) {
		if (funcData.key.toString() === nameExpression)
			return { code, name: funcData.key };
	}

	const codeWrapper = makeResultOfExpression(nameExpression, obj.name);

	if (codeWrapper) {
		if (funcData.isMethod) {
			code = makeExpression("{", code, "}[", nameExpression, "]");
			funcData.isMethod = false;
		}
		if (funcData.isGetterSetter) {
			code = makeExpression(
				"Object.getOwnPropertyDescriptor({",
				code,
				"},",
				nameExpression,
				").",
				funcData.prefix
			);
			funcData.isGetterSetter = false;
		}
		const wrappedCode = codeWrapper(code);
		wrappedCode.wrappedInFunction = true;
		return { code: wrappedCode, name: obj.name };
	}

	let name = obj.name;
	if (funcData.key) {
		name = funcData.key;
		if (typeof funcData.key == "string")
			funcData.key = JSON.stringify(funcData.key);
	}

	code = makeExpression(
		code.substr(0, nameExpFirstIndex + 1),
		funcData.key || name,
		code.substr(nameExpLastIndex)
	);
	return { code, name };
};

module.exports = functionNameExpressionChanger;
