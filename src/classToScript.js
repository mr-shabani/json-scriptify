/**
 * give a class object and make a script for that.
 */

const tokens = []; // list of tokens
// empty string for "end" means any single character
const scapeBackslashToken = { begin: "\\", end: "", innerTokens: [] };
tokens.push(
	{ begin: '"', end: '"', innerTokens: [scapeBackslashToken] },
	{ begin: "`", end: "`", innerTokens: [scapeBackslashToken] },
	{ begin: "'", end: "'", innerTokens: [scapeBackslashToken] },
	{ begin: "//", end: "\n", innerTokens: [] },
	{ begin: "/*", end: "*/", innerTokens: [] },
	{ begin: "(", end: ")", innerTokens: tokens },
	{ begin: "{", end: "}", innerTokens: tokens }
);

const wantedTokens = [")", "}"];

/**
 * find index of tokens and save the index of start and end of wanted tokens in a map.
 *
 * @param {string} code is toString of class
 * @returns {Map<number, number>} Map[startIndex]==endIndex and Map[endIndex]==startIndex
 */
var tokenize = function(code) {
	let tokenIndexesMap = new Map();
	let stack = [];
	let lastToken = { innerTokens: tokens };
	for (let index = 0; index < code.length; ++index) {
		let isEqual = true;
		if (stack.length) {
			lastToken = stack[stack.length - 1][1];
			let end = lastToken.end;
			for (let endIndex = 0; endIndex < end.length; endIndex++) {
				if (end[endIndex] != code[index + endIndex]) isEqual = false;
			}
			if (isEqual) {
				if (wantedTokens.includes(end)) {
					let beginIndex = stack[stack.length - 1][0];
					tokenIndexesMap.set(beginIndex, index);
					tokenIndexesMap.set(index, beginIndex);
				}
				stack.pop();
				continue;
			}
		}
		for (let token of lastToken.innerTokens) {
			isEqual = true;
			let begin = token.begin;
			for (let beginIndex = 0; beginIndex < begin.length; beginIndex++) {
				if (begin[beginIndex] != code[index + beginIndex]) isEqual = false;
			}
			if (isEqual) {
				stack.push([index, token]);
				break;
			}
		}
	}
	return tokenIndexesMap;
};

var variableNameRegexp = "[a-zA-Z_]+\\w*";
var classNameRegexp = `^class\\s+(?<className>${variableNameRegexp})`;
var classWithParentNameRegexp = `${classNameRegexp}(?:\\s+extends\\s+(?<parentName>.+))*`;
var onlyOneVariableNameRegexp = `^(${variableNameRegexp})$`;
// eslint-disable-next-line no-useless-escape
var onlyHasMembershipRelationsRegexp = `^(${variableNameRegexp}\.)+(${variableNameRegexp})?$`;
onlyOneVariableNameRegexp = new RegExp(onlyOneVariableNameRegexp);
classWithParentNameRegexp = new RegExp(classWithParentNameRegexp);
onlyHasMembershipRelationsRegexp = new RegExp(onlyHasMembershipRelationsRegexp);

/**
 * Analyze class string code to find the parent name of the class if exist.
 * parent name may be a complex expression. If parent name expression only
 * includes membership expressions, we reconstruct it. but for more complex
 * expressions we change the code and replace the parent name with name 'p'.
 *
 * @param {string} code is toString of class object
 * @returns {Array.<{className:string, parentScriptConstructor: function, code: string}> }
 */
var classExpressionAnalyze = function(code) {
	let tokenIndexesMap = tokenize(code);
	let classBodyLastIndex = code.lastIndexOf("}");
	let classBodyFirstIndex = tokenIndexesMap.get(classBodyLastIndex);
	var { parentName } = code
		.substr(0, classBodyFirstIndex)
		.match(classWithParentNameRegexp).groups;
	let parentScriptConstructor = null;
	if (parentName) {
		let parentNameIndex = classBodyFirstIndex - parentName.length;
		parentName = parentName.trim();
		parentScriptConstructor = parentScript => ({
			argumentVariable: parentName,
			argumentScript: parentScript
		});
		if (onlyOneVariableNameRegexp.test(parentName) == false) {
			if (onlyHasMembershipRelationsRegexp.test(parentName)) {
				let parentNameArray = parentName.split(".");
				let firstName = parentNameArray.shift();
				let endBraces = parentNameArray.map(() => "}").join("");
				parentScriptConstructor = parentScript => ({
					argumentVariable: firstName,
					argumentScript:
						"{" + parentNameArray.join(":{") + ":" + parentScript + endBraces
				});
			} else {
				code =
					code.substr(0, parentNameIndex) +
					"p" +
					code.substr(classBodyFirstIndex - 1);
				parentScriptConstructor = parentScript => ({
					argumentVariable: "p",
					argumentScript: parentScript
				});
			}
		}
	}
	return [parentName, parentScriptConstructor, code];
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
 * @param {function} makeExpression
 * @returns {Array.<(ExpressionClass|String|ScriptClass)>}
 */
var classToScript = function(obj, getScript, path, makeExpression) {
	let stringOfObj = obj.toString();
	let [parentName, parentConstructor, code] = classExpressionAnalyze(
		stringOfObj
	);
	let scriptArray = [];
	if (parentConstructor) {
		let parentClassPath = path.add("__proto__");
		let parentScript = getScript(obj.__proto__, parentClassPath);
		let parentInitScript = parentScript.popInit();
		if (parentInitScript.isEmpty()) {
			scriptArray.push(makeExpression());
			parentInitScript = parentScript.popInit();
		}
		if (parentName == parentInitScript)
			scriptArray.push(`(function(){\n return ${code};\n })()`, parentScript);
		else {
			let { argumentVariable, argumentScript } = parentConstructor(
				parentInitScript
			);
			scriptArray.push(
				`(function(${argumentVariable}){\n  return ${code};\n })(${argumentScript})`,
				parentScript
			);
		}
	} else scriptArray.push(`(function(){\n  return ${obj.toString()};\n })()`);
	return scriptArray;
};

module.exports = classToScript;
