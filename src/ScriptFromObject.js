"use strict";
const {
	classes: classesToScript,
	types: typesToScript
} = require("./toScript");
const { innerObject, isInstanceOf, funcNameRegexp } = require("./helper");
const PathClass = require("./PathClass");
const predefinedValues = require("./predefinedValues");

const { ExpressionClass } = require("./ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

/**
 * create script expressions from object
 * @class ScriptClass
 */
class ScriptClass {
	/**
	 * @param {any} obj
	 * @param {ScriptClass} parent
	 * @param {PathClass} path
	 * @param {Object} options
	 */
	constructor(obj, parent, path, options) {
		this.getScript = this.getScript.bind(this);
		/** @type {Array.<(string|ExpressionClass|ScriptClass)>} */
		this.expressions = [];
		/** @type {ScriptClass} */
		this.parent = parent;
		if (parent) {
			this.shared = parent.shared;
			if (typeof path == "undefined") {
				this.path = new PathClass();
				this.path.getSharedItems(parent.path);
			} else this.path = path;
		} else {
			var objName = "obj";
			if (typeof obj == "function") {
				const funcName = obj.name;
				if (typeof funcName == "string") {
					const regexpMatch = Function.prototype.toString
						.call(obj)
						.match(funcNameRegexp);
					if (
						regexpMatch &&
						funcName == regexpMatch.groups.name &&
						funcName.length <= 5 &&
						funcName != "_"
					)
						objName = funcName;
					else if (objName == funcName) objName = "Obj";
				}
			}
			this.path = new PathClass(objName);
			this.path.newSharedItems();
			this.shared = {
				mark: new Map(
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
					this.shared.mark.set(x[1], newPath);
				});
			}
		}
		if (obj instanceof innerObject) {
			obj = obj.value;
		} else if (this.shared.options.replacer) {
			obj = this.shared.options.replacer(obj);
		}
		this.createExpressions(obj);
	}

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

		if (this.shared.mark.has(obj)) {
			let referencePath = this.shared.mark.get(obj);
			if (referencePath.isBefore(this.path))
				this.addExpression(makeExpression(this.path, "=", referencePath));
			else
				this.addExpression([
					makeExpression(),
					makeExpression(this.path, "=", referencePath)
				]);
			return;
		}
		this.shared.mark.set(obj, this.path);

		/** @type {Array<string>} keys that must be ignored during makeScriptFromObjectProperties */
		var ignoreProperties = [];
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
		var allPropertyKeys = Object.getOwnPropertyNames(obj).concat(
			Object.getOwnPropertySymbols(obj)
		);

		var propertiesWithDescriptionOf = {};

		const descriptionList = ["enumerable", "writable", "configurable"];

		allPropertyKeys.forEach(key => {
			if (ignoreProperties.includes(key)) return;

			var desc = Object.getOwnPropertyDescriptor(obj, key);

			let descriptionsText = `${desc.enumerable} ${desc.writable} ${desc.configurable}`;

			if (!propertiesWithDescriptionOf[descriptionsText])
				propertiesWithDescriptionOf[descriptionsText] = {};
			if (desc.configurable == false) delete desc.configurable;
			if (desc.enumerable == false) delete desc.enumerable;
			if (desc.writable == false) delete desc.writable;
			if (desc.hasOwnProperty("get") && desc.get == undefined) delete desc.get;
			if (desc.hasOwnProperty("set") && desc.set == undefined) delete desc.set;
			if (descriptionsText == "true true true")
				propertiesWithDescriptionOf[descriptionsText][key] = desc.value;
			else
				propertiesWithDescriptionOf[descriptionsText][key] = new innerObject(
					desc
				);
		});

		var allExistDescriptionsText = Object.keys(propertiesWithDescriptionOf);

		allExistDescriptionsText.forEach(descriptionsText => {
			if (descriptionsText == "true true true") {
				const allTrueProperties = propertiesWithDescriptionOf["true true true"];
				const newPath = this.path.cloneWithNewInitTime();
				const propertiesScript = this.getScript(
					new innerObject(allTrueProperties),
					newPath
				);
				const initScript = propertiesScript.popInit();
				if (initScript.isEmpty() == false)
					this.addExpression(
						makeExpression("Object.assign(", newPath, ",", initScript, ")")
					);
				this.addExpression(propertiesScript);
			} else {
				this.addExpression(
					makeExpression(
						"Object.defineProperties(",
						this.path,
						",",
						this.getScript(
							new innerObject(propertiesWithDescriptionOf[descriptionsText])
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
	 * @returns {(ScriptClass|PathClass|ExpressionClass)}
	 */
	getScript(obj, path) {
		let markSize = this.shared.mark.size;
		let objScript = new ScriptClass(obj, this, path);
		if (path) return objScript;
		if (this.shared.mark.size == markSize) {
			if (objScript.expressions.length == 1) return objScript.popInit();
		}
		this.addExpression(objScript);
		return objScript.path;
	}

	/**
	 * return a script that when be evaluated produce the same object as original
	 * @method
	 */
	export() {
		const lineBreak = this.shared.options.lineBreak;
		if (
			this.expressions.length == 1 &&
			this.expressions[0] instanceof ExpressionClass
		)
			return "(" + this.popInit() + ")";
		var str = "(function(){" + lineBreak;
		let rawScript = this.getRawScript();
		if (!this.parent) {
			if (this.path._newName() != "_.a") str += "const _={};" + lineBreak;
			str += `var ${this.path};${lineBreak}`;
		}
		str += rawScript;
		if (this.parent) str += `})()`;
		else str += `return ${this.path};${lineBreak}})()`;
		return str;
	}

	/**
	 * join expression of this.expressions and return the script
	 * @method
	 */
	getRawScript() {
		const lineBreak = this.shared.options.lineBreak;
		var script = "";
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
