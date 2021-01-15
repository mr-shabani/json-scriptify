const { cleanKey, ObjectWrapper } = require("./utility");
const { analyseFunctionCode } = require("./functions/functionUtility");

const { ExpressionClass } = require("./ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const objectToScript = function(obj, getScript, path, wrapObj) {
	const descriptors = {};

	let keys = Object.keys(obj)
		.concat(Object.getOwnPropertySymbols(obj))
		.filter(key => {
			const desc = Object.getOwnPropertyDescriptor(obj, key);
			descriptors[key] = desc;
			return desc.configurable && desc.enumerable && desc.writable !== false;
		});

	const ignoreProperties = [];

	if (wrapObj && wrapObj.hiddenKeys) {
		keys = keys.filter(key => !wrapObj.hiddenKeys.includes(key));
	}

	const objInitExpression = [];
	const nextScript = [];

	keys.forEach(key => {
		const desc = descriptors[key];
		/**
		 * @type{(ExpressionClass|PathClass)} 
		 * if replacer return scriptify.ignore for this key, keyPath will be an empty expression.
		 * 
		 * if key is a string, keyPath will be stringify of it.
		 * 
		 * if key is a cached symbol, keyPath will be a PathClass instance.
		 * 
		 * if key is a new symbol, keyPath is an expression that has greater init time than path.
		 */
		const keyPath = getScript(key);
		if (path.isNotAfter(keyPath)) return;
		if (keyPath.isEmpty()) {
			ignoreProperties.push(key);
			return;
		}
		if ("value" in desc) {
			if (typeof desc.value == "function")
				desc.value = new ObjectWrapper(desc.value, {
					key: typeof key == "symbol" ? keyPath : key,
					type: "method",
					isInObject: true
				});
			const valueScript = getScript(desc.value, path.add(key, getScript));
			const initValueScript = valueScript.popInit();
			if (initValueScript.isEmpty() == false) {
				if (desc.value instanceof ObjectWrapper && desc.value.noNeedKey) {
					objInitExpression.push(initValueScript, ",");
				} else if (typeof key == "symbol") {
					objInitExpression.push("[", keyPath, "]:", initValueScript, ",");
				} else objInitExpression.push(cleanKey(key), ":", initValueScript, ",");
			}
			nextScript.push(valueScript);
		}
		if (desc.get) {
			const funcData = analyseFunctionCode(
				Function.prototype.toString.call(desc.get)
			);
			if (funcData.prefix !== "get") return;
			if (funcData.name && funcData.name !== key) return;
		}
		if (desc.set) {
			const funcData = analyseFunctionCode(
				Function.prototype.toString.call(desc.set)
			);
			if (funcData.prefix !== "set") return;
			if (funcData.name && funcData.name !== key) return;
		}
		if (desc.get) {
			const getterPath = path.newPath(
				makeExpression(
					"Object.getOwnPropertyDescriptor(",
					path,
					",",
					keyPath,
					").get"
				)
			);
			desc.get = new ObjectWrapper(desc.get, {
				key: typeof key == "symbol" ? keyPath : key,
				type: "get",
				path: getterPath,
				isInObject: true
			});
			const valueScript = getScript(desc.get, getterPath);
			const initValueScript = valueScript.popInit();
			if (initValueScript.isEmpty() == false) {
				if (desc.get.noNeedKey) {
					objInitExpression.push(initValueScript, ",");
				} else throw new Error("Oops! impossible!");
			}
			nextScript.push(valueScript);
		}
		if (desc.set) {
			const setterPath = path.newPath(
				makeExpression(
					"Object.getOwnPropertyDescriptor(",
					path,
					",",
					keyPath,
					").set"
				)
			);
			desc.set = new ObjectWrapper(desc.set, {
				key: typeof key == "symbol" ? keyPath : key,
				type: "set",
				path: setterPath,
				isInObject: true
			});
			const valueScript = getScript(desc.set, setterPath);
			const initValueScript = valueScript.popInit();
			if (initValueScript.isEmpty() == false) {
				if (desc.set.noNeedKey) {
					objInitExpression.push(initValueScript, ",");
				} else throw new Error("Oops! impossible!");
			}
			nextScript.push(valueScript);
		}
		ignoreProperties.push(key);
	});

	objInitExpression.pop();

	/** @type {string[]} object keys that will be ignored in produce script*/
	this.ignoreProperties = ignoreProperties;

	/** 'init' expressions will be inserted at the first and
	 *  'add' expressions will be inserted at the last.*/
	return {
		init: makeExpression(path, "=", "{", objInitExpression, "}"),
		add: nextScript
	};
};

module.exports = objectToScript;
