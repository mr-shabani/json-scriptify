"use strict";
const {
	classes: classesToScript,
	types: typesToScript
} = require("./toScript");

const { InnerObject, isInstanceOf } = require("./utility");
const PathClass = require("./PathClass");
const predefinedValues = require("./predefinedValues");
const { funcNameRegexp } = require("./functions/functionUtility");

const { ExpressionClass } = require("./ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const defaultObjName = "obj";

/**
 * @typedef {(string|ExpressionClass|ScriptClass)} GeneralExpression
 */
/**
 * @typedef {(GeneralExpression|Array.<GeneralExpression>)} GeneralExpressionArray
 */

/**
 * If name of function, in it's code, is same as func.name and the name is not
 * long or equal to "_", return the name.
 * @param {Function} obj
 * @returns {(string|undefined)} objName
 */
const getNameFromFunction = function(func) {
	let objName;
	const funcName = func.name;
	if (typeof funcName == "string") {
		const regexpMatch = Function.prototype.toString
			.call(func)
			.match(funcNameRegexp);
		if (
			regexpMatch &&
			funcName == regexpMatch.groups.name &&
			funcName.length <= 5 &&
			funcName != "_"
		)
			objName = funcName;
		else if (defaultObjName == funcName)
			objName = defaultObjName[0].toUpperCase() + defaultObjName.substr(1);
	}
	return objName;
};

/**
 * create script expressions from object
 * @class ScriptClass
 */
class ScriptClass {
	/**
	 * @typedef {Object} Options
	 * @property {Function} [replacer]
	 * @property {Array.<[string,any]>} [predefined]
	 * @property {string} lineBreak
	 */
	/**
	 * @param {(Options|SharedItems)} options
	 */
	constructor(options) {
		this.getScript = this.getScript.bind(this);

		if (!options.isSharedItems) {
			/** @type {PathClass} path */
			this.path = new PathClass(defaultObjName);
			this.path.newSharedItems();
		}

		this.createSharedItems(options);
	}

	/**
	 * @typedef {Object} SharedItems
	 * @property {boolean} shared.isSharedItems
	 * @property {Map.<any,PathClass>} shared.cache
	 * @property {Options} shared.options
	 */
	/**
	 * When options is a SharedItems, only set this.shared as options.
	 * In the other way, make new shared items at this.shared.
	 * @param {(Options|SharedItems)} options
	 */
	createSharedItems(options) {
		if (options.isSharedItems) {
			this.shared = options;
			return true;
		}
		/** @type {SharedItems} */
		this.shared = {
			isSharedItems: true,
			cache: new Map(
				predefinedValues.map(([value, script]) => {
					let newPath = this.path.newPath(script);
					newPath.initTime = 0;
					return [value, newPath];
				})
			),
			options: options
		};
		if (options.predefined instanceof Array) {
			options.predefined.forEach(x => {
				if (x instanceof Array == false)
					throw new TypeError("options.predefined must be an array.");
				if (x.length != 2)
					throw new TypeError(
						"Each element of options.predefined must be an array of 2 element."
					);
				if (typeof x[0] != "string")
					throw new TypeError(
						"options.predefined must be [ ['script text',value] , ... ]."
					);
				let newPath = this.path.newPath(x[0]);
				newPath.initTime = 0;
				this.shared.cache.set(x[1], newPath);
			});
		}
	}

	/**
	 * Create new ScriptClass instance with same shared items as parent,
	 * and build expression of obj in it.
	 * @param {any} obj
	 * @param {ScriptClass} parent
	 * @param {PathClass} [path]
	 *
	 * @returns {ScriptClass} newScript
	 */
	_newScript(obj, parent, path) {
		const newScript = new ScriptClass(this.shared);
		newScript.parent = parent;
		if (typeof path == "undefined") {
			newScript.path = new PathClass();
			newScript.path.getSharedItems(parent.path);
		} else newScript.path = path;
		newScript.buildExpressionsOf(obj);
		return newScript;
	}

	buildExpressionsOf(obj) {
		/** @type {Array.<(ScriptClass|ExpressionClass)>}
		 * The first expression must be initial expression and can be empty expression */
		this.expressions = [];
		if (!this.path.parent) {
			if (typeof obj == "function") {
				const funcName = getNameFromFunction(obj);
				if (funcName) this.path.key = funcName;
			}
		}
		if (obj instanceof InnerObject) {
			obj = obj.getReplacement(this.shared.options.replacer);
		} else if (this.shared.options.replacer) {
			obj = this.shared.options.replacer(obj);
		}
		this.createExpressions(obj);
	}

	/**
	 * Add expression to this.expression.
	 * @param {(GeneralExpressionArray|{init:GeneralExpressionArray,add:GeneralExpressionArray})} expression
	 * @param {number} place
	 */
	addExpression(expression, place) {
		if (typeof expression == "string") {
			this.addExpression(makeExpression(this.path, "=", expression), place);
			return;
		}
		if (expression instanceof ExpressionClass) {
			if (typeof place == "number")
				this.expressions.splice(place, 0, expression);
			else this.expressions.push(expression);
			return;
		}
		if (expression instanceof ScriptClass) {
			if (expression.expressions.length == 0) return;
			if (typeof place == "number")
				this.expressions.splice(place, 0, expression);
			else this.expressions.push(expression);
			return;
		}
		if (expression instanceof Array) {
			if (typeof place == "number") {
				expression.forEach((expr, index) => {
					this.addExpression(expr, place + index);
				});
			} else {
				expression.forEach(expr => {
					this.addExpression(expr);
				});
			}
			return;
		}
		if (typeof expression == "object") {
			if (expression.init) this.addExpression(expression.init, 0);
			if (expression.add) this.addExpression(expression.add);
		}
	}

	createExpressions(obj) {
		for (let type of typesToScript) {
			if (type.isTypeOf(obj)) {
				this.addExpression(type.toScript(obj));
				return;
			}
		}

		if (!["object", "function", "symbol"].includes(typeof obj)) return;

		if (obj instanceof InnerObject && obj.isInCache(this.shared.cache)) {
			obj = obj.value;
		}

		if (this.shared.cache.has(obj)) {
			let referencePath = this.shared.cache.get(obj);
			if (referencePath.isBefore(this.path))
				// When referencePath is initialized.
				this.addExpression(makeExpression(this.path, "=", referencePath));
			// When referencePath is not initialized yet, we set the initial expression of this as empty.
			else
				this.addExpression([
					makeExpression(),
					makeExpression(this.path, "=", referencePath)
				]);
			return;
		}
		if (obj instanceof InnerObject) {
			this.shared.cache.set(obj.value, this.path);
		} else this.shared.cache.set(obj, this.path);

		/** @type {Array<string>} keys that must be ignored during makeScriptFromObjectProperties */
		let ignoreProperties = [];
		for (let cls of classesToScript) {
			if (isInstanceOf(cls, obj)) {
				const expression = cls.toScript(obj, this.getScript, this.path);
				this.addExpression(expression);
				ignoreProperties = cls.ignoreProperties || [];
				break;
			}
		}
		this.makeScriptFromObjectProperties(obj, ignoreProperties);
	}

	/**
	 * @param {any} obj
	 * @param {Array<string>} ignoreProperties list of properties that must be ignored
	 */
	makeScriptFromObjectProperties(obj, ignoreProperties) {
		if (obj instanceof InnerObject) obj = obj.value;

		const allPropertyKeys = Object.getOwnPropertyNames(obj).concat(
			Object.getOwnPropertySymbols(obj)
		);

		const propertiesWithDescriptionOf = {};

		const descriptionList = ["enumerable", "writable", "configurable"];

		allPropertyKeys.forEach(key => {
			if (ignoreProperties.includes(key)) return;

			const desc = Object.getOwnPropertyDescriptor(obj, key);

			const descriptionsText = `${desc.enumerable} ${desc.writable} ${desc.configurable}`;

			if (!propertiesWithDescriptionOf[descriptionsText])
				propertiesWithDescriptionOf[descriptionsText] = {};
			if (desc.configurable == false) delete desc.configurable;
			if (desc.enumerable == false) delete desc.enumerable;
			if (desc.writable == false) delete desc.writable;
			// eslint-disable-next-line no-prototype-builtins
			if (desc.hasOwnProperty("get") && desc.get == undefined) delete desc.get;
			// eslint-disable-next-line no-prototype-builtins
			if (desc.hasOwnProperty("set") && desc.set == undefined) delete desc.set;
			if (descriptionsText == "true true true")
				propertiesWithDescriptionOf[descriptionsText][key] = desc.value;
			else
				propertiesWithDescriptionOf[descriptionsText][key] = new InnerObject(
					desc
				);
		});

		const allExistDescriptionsText = Object.keys(propertiesWithDescriptionOf);

		allExistDescriptionsText.forEach(descriptionsText => {
			if (descriptionsText == "true true true") {
				const allTrueProperties = propertiesWithDescriptionOf["true true true"];
				const thisPath = this.path.cloneWithNewInitTime();
				const propertiesScript = this.getScript(
					new InnerObject(allTrueProperties),
					thisPath
				);
				const initScript = propertiesScript.popInit();
				if (initScript.isEmpty() == false)
					this.addExpression(
						makeExpression("Object.assign(", thisPath, ",", initScript, ")")
					);
				this.addExpression(propertiesScript);
			} else {
				this.addExpression(
					makeExpression(
						"Object.defineProperties(",
						this.path,
						",",
						this.getScript(
							new InnerObject(propertiesWithDescriptionOf[descriptionsText])
						),
						")"
					)
				);
			}
		});
	}

	/**
	 * if path is presented will return ScriptClass of obj and nothing will be added to this.expressions.
	 * else, first add expression of object script to this.expressions then return the path of that
	 * @param {any} obj
	 * @param {PathClass} [path] the path of obj
	 * @returns {(ScriptClass|PathClass|ExpressionClass)} if path is provided return ScriptClass.
	 */
	getScript(obj, path) {
		let cacheSize = this.shared.cache.size;
		let objScript = this._newScript(obj, this, path);
		if (path) return objScript;
		if (this.shared.cache.size == cacheSize) {
			if (objScript.expressions.length == 1) return objScript.popInit();
		}
		this.addExpression(objScript);
		return objScript.path;
	}

	/**
	 * return a script that when be evaluated produce the same object as original
	 * @returns {string} The script that when be evaluated produce an object same as original object
	 */
	export() {
		const lineBreak = this.shared.options.lineBreak;
		if (
			this.expressions.length == 1 &&
			this.expressions[0] instanceof ExpressionClass
		)
			return "(" + this.popInit() + ")";
		let str = "(function(){" + lineBreak;
		let rawScript = this.getRawScript();
		if (!this.parent) {
			if (this.path._newName() != "_.a") str += "const _={};" + lineBreak;
			str += `let ${this.path};${lineBreak}`;
		}
		str += rawScript;
		if (this.parent) str += `})()`;
		else str += `return ${this.path};${lineBreak}})()`;
		return str;
	}

	/**
	 * join expression of this.expressions and return the script
	 */
	getRawScript() {
		const lineBreak = this.shared.options.lineBreak;
		let script = "";
		this.expressions.forEach(expr => {
			if (expr instanceof ExpressionClass && expr.isEmpty() == false)
				script += expr + ";" + lineBreak;
			if (expr instanceof ScriptClass) script += expr.getRawScript();
			if (typeof expr == "string") script += expr;
		});
		return script;
	}

	/**
	 * return initialize expression of object script
	 * @returns {ExpressionClass}
	 */
	popInit() {
		let init = this.expressions.shift();
		if (init instanceof ExpressionClass) return init.removeAssignment();
		if (init instanceof ScriptClass) return init.popInit();
	}
	toString() {
		return this.getRawScript();
	}
}

module.exports = ScriptClass;
