const namedExpressionChanger = require("./namedExpressionFunction");

const { ExpressionClass } = require("../ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const PathClass = require("../PathClass");

const hasOwn = Object.prototype.hasOwnProperty;
const {
	getSameProperties,
	getSamePropertiesWhenEvaluated,
	hideKeys,
	FunctionWrapper
} = require("../utility");

const {
	analyseFunctionCode,
	isExtendableFunction
} = require("./functionUtility");

const classToScript = require("./classToScript");

const functionToScript = function(obj, getScript, path) {
	let scriptArray;
	let isInObject = false;
	if (obj instanceof FunctionWrapper) {
		var wrapObj = obj;
		obj = obj.value;
		isInObject = true;
	}

	let funcCode = Function.prototype.toString.call(obj);
	const funcData = analyseFunctionCode(funcCode);

	let codeToTestSimilarity;

	if (funcData.hasNameExpression) {
		if (wrapObj) funcData.key = wrapObj.key;
		const newCodeAndName = namedExpressionChanger(obj, funcData);
		funcCode = newCodeAndName.code;
		if (newCodeAndName.code.wrappedInFunction) isInObject = false;
		funcData.name = newCodeAndName.name;
	}

	if (funcData.isNative)
		throw new TypeError("native code functions cannot be scriptified!");

	if (funcData.isClass) scriptArray = classToScript(obj, getScript, path);
	else if (funcData.isMethod) {
		if (
			funcData.name === "function" && // function(){} can be an anonymous function or a method
			!funcData.isGenerator && // *function(){} always is a method
			isExtendableFunction(obj) // methods are not extendable but anonymous functions are extendable
		) {
			// obj is a anonymous function
			scriptArray = [funcCode];
			funcData.name = "";
		} else {
			// obj is a method
			scriptArray = [
				makeExpression(
					"({",
					funcCode,
					"})[",
					typeof funcData.name == "string"
						? JSON.stringify(funcData.name)
						: funcData.name,
					"]"
				)
			];
			if (
				isInObject &&
				wrapObj.type == "method" &&
				funcData.name === wrapObj.key
			) {
				codeToTestSimilarity = scriptArray[0];
				scriptArray = [funcCode];
				wrapObj.noNeedKey = true;
			}
		}
	} else if (funcData.isGetterSetter) {
		scriptArray = [
			makeExpression(
				"Object.getOwnPropertyDescriptor({",
				funcCode,
				"},",
				typeof funcData.name == "string"
					? JSON.stringify(funcData.name)
					: funcData.name,
				").",
				funcData.prefix
			)
		];
		if (
			isInObject &&
			funcData.prefix === wrapObj.type &&
			funcData.name === wrapObj.key
		) {
			codeToTestSimilarity = scriptArray[0];
			scriptArray = [funcCode];
			wrapObj.noNeedKey = true;
		}
	} else scriptArray = [funcCode];

	if (hasOwn.call(obj, "prototype")) {
		scriptArray.push(...makePrototypeExpressions(obj, getScript, path));
	}
	try {
		if (codeToTestSimilarity)
			this.ignoreProperties = getSamePropertiesWhenEvaluated(
				obj,
				codeToTestSimilarity
			);
		else
			this.ignoreProperties = getSamePropertiesWhenEvaluated(
				obj,
				scriptArray[0]
			);
	} catch (e) {
		this.ignoreProperties = [];
	}
	if (wrapObj) {
		// is in object :
		if (!funcData.name || funcData.name === wrapObj.key)
			if (obj.name === wrapObj.key) this.ignoreProperties.push("name");
	} // else if (obj.name === funcData.name) this.ignoreProperties.push("name");
	this.ignoreProperties.push("prototype");

	if (
		typeof scriptArray[0] == "string" ||
		(scriptArray[0].isEmpty() == false && scriptArray[0].expressions[0] != path)
	)
		scriptArray[0] = makeExpression(path, "=", scriptArray[0]);
	return scriptArray;
};

const makePrototypeExpressions = function(obj, getScript, path) {
	const default_prototype = Object.defineProperty({}, "constructor", {
		value: obj,
		writable: true,
		configurable: true
	});
	Object.setPrototypeOf(
		default_prototype,
		Object.getPrototypeOf(obj.prototype)
	);

	const prototypeDescriptor = Object.getOwnPropertyDescriptor(obj, "prototype");
	const prototypePath = path.addWithNewInitTime("prototype");

	const hiddenKeys = getSameProperties(obj.prototype, default_prototype);

	const prototypeScript = getScript(
		hideKeys(obj.prototype, hiddenKeys),
		prototypePath
	);

	let prototypeInitScript = prototypeScript.popInit();
	if (prototypeInitScript.isEmpty())
		prototypeInitScript = prototypeScript.popInit();

	const scriptArray = [];

	if (prototypeInitScript.expressions[0] instanceof PathClass) {
		if (prototypeDescriptor.writable)
			scriptArray.push(
				makeExpression(prototypePath, "=", prototypeInitScript),
				prototypeScript
			);
		// else : this may work in some situation but we must implement general solution for this case.
		else
			scriptArray.push(
				makeExpression(prototypeInitScript, "=", prototypePath),
				prototypeScript
			);
	} else if (
		hiddenKeys.length ===
		Object.getOwnPropertyNames(obj.prototype).length +
			Object.getOwnPropertySymbols(obj.prototype).length
	) {
		// all properties is same as default. So, no need to add any expressions.
		return scriptArray;
	} else {
		scriptArray.push(
			makeExpression(
				"Object.assign(",
				prototypePath,
				",",
				prototypeInitScript,
				")"
			),
			prototypeScript
		);
	}

	return scriptArray;
};

module.exports = functionToScript;
