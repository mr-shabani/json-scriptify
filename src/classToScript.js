const tokens = []; // list of tokens.
// empty string for end character means any single character.
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

let tokenIndex = new Map();
const wantedTokens = [")", "}"];

var tokenize = function(code) {
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
					tokenIndex.set(beginIndex, index);
					tokenIndex.set(index, beginIndex);
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
	return tokenIndex;
};

var variableNameRegexp = "[a-zA-Z_]+\\w*";
var classNameRegexp = `^class\\s+(?<className>${variableNameRegexp})`;
var classWithParentNameRegexp = `${classNameRegexp}(?:\\s+extends\\s+(?<parentName>.+))*`;
var onlyOneVariableNameRegexp = `^(${variableNameRegexp})$`;
var onlyHasMembershipRelationsRegexp = `^(${variableNameRegexp}\.)+(${variableNameRegexp})?$`;
onlyOneVariableNameRegexp = new RegExp(onlyOneVariableNameRegexp);
classWithParentNameRegexp = new RegExp(classWithParentNameRegexp);
onlyHasMembershipRelationsRegexp = new RegExp(onlyHasMembershipRelationsRegexp);

var classExpressionAnalyze = function(code) {
	tokenize(code);
	let classBodyLastIndex = code.lastIndexOf("}");
	let classBodyFirstIndex = tokenIndex.get(classBodyLastIndex);
	var { className, parentName } = code
		.substr(0, classBodyFirstIndex)
		.match(classWithParentNameRegexp).groups;
	let parentConstructor = null;
	if (parentName) {
		let parentNameIndex = classBodyFirstIndex - parentName.length;
		parentName = parentName.trim();
		parentConstructor = parentScript => `let ${parentName}=${parentScript};\n`;
		if (onlyOneVariableNameRegexp.test(parentName) == false) {
			if (onlyHasMembershipRelationsRegexp.test(parentName)) {
				let parentNameArray = parentName.split(".");
				let firstName = parentNameArray.shift();
				let endBraces = parentNameArray.map(() => "}").join("");
				parentConstructor = parentScript =>
					"let " +
					firstName +
					"={" +
					parentNameArray.join(":{") +
					":"+
					parentScript +
					endBraces +
					";\n";
			} else {
				code =
					code.substr(0, parentNameIndex) +
					"p" +
					code.substr(classBodyFirstIndex - 1);
				parentConstructor = parentScript => `let p=${parentScript};\n`;
			}
		}
	}
	return [className, parentConstructor, code];
};

var classToScript = function(obj, getScript, path, makeExpression) {
	let stringOfObj = obj.toString();
	let [className, parentConstructor, code] = classExpressionAnalyze(
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
		scriptArray.push(
			`(function(){\n  ${parentConstructor(
				parentInitScript
			)}  return ${code};\n  })()`,
			parentScript
		);
	} else
		scriptArray.push(`(function(){\n    return ${obj.toString()};\n  })()`);
	return scriptArray;
};

module.exports = classToScript;
