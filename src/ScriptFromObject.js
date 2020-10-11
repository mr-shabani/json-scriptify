var { classes: classesToScript, types: typesToScript } = require("./toScript");
var { isInstanceOf, PathClass, ExpressionClass } = require("./helper");
var makeExpression = ExpressionClass.prototype.makeExpression;

/**
 * create script expressions from object
 * @class ScriptClass
 */
class ScriptClass {
	/**
	 * @param {any} obj
	 * @param {ScriptClass} parent
	 * @param {PathClass} path
	 */
	constructor(obj, parent, path) {
		this.getScript = this.getScript.bind(this);
		/** @type {Array.<(string|ExpressionClass|ScriptClass)>} */
		this.expressions = [];
		/** @type {ScriptClass} */
		this.parent = parent;
		if (parent) {
			/** @type {Map.<(Object|symbol|function), PathClass>} */
			this.mark = parent.mark;
			if (typeof path == "undefined") {
				this.path = new PathClass();
				this.path.getSharedItems(parent.path);
			} else this.path = path;
		} else {
			this.mark = new Map();
			this.path = new PathClass("obj");
			this.path.newSharedItems();
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

		if (this.mark.has(obj)) {
			let referencePath = this.mark.get(obj);
			if (referencePath.isBefore(this.path))
				this.addExpression(makeExpression(this.path, "=", referencePath));
			else
				this.addExpression([
					makeExpression(),
					makeExpression(this.path, "=", referencePath)
				]);
			return;
		}
		this.mark.set(obj, this.path);

		/** @type {Array<string>} keys that must be ignored during makeScriptFromObjectProperties */
		var ignoreProperties = [];
		for (let cls of classesToScript) {
			if (isInstanceOf(cls.type, obj)) {
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

			var descriptor = Object.getOwnPropertyDescriptor(obj, key);

			let descriptionsText = `${descriptor.enumerable} ${descriptor.writable} ${descriptor.configurable}`;

			if (propertiesWithDescriptionOf[descriptionsText])
				propertiesWithDescriptionOf[descriptionsText].push([
					key,
					descriptor.value
				]);
			else {
				propertiesWithDescriptionOf[descriptionsText] = [
					[key, descriptor.value]
				];
			}
		});

		var allExistDescriptionsText = Object.keys(propertiesWithDescriptionOf);

		allExistDescriptionsText.forEach(descriptionsText => {
			if (descriptionsText == "true true true") {
				if (propertiesWithDescriptionOf["true true true"].length < 3) {
					propertiesWithDescriptionOf["true true true"].forEach(
						([key, value]) => {
							const valuePath = this.path.addWithNewInitTime(
								key,
								this.getScript
							);
							let valueScript = this.getScript(value, valuePath);
							this.addExpression([
								makeExpression(valuePath, "=", valueScript.popInit()),
								valueScript
							]);
						}
					);
				} else {
					this.addExpression(
						makeExpression(
							this.getScript(propertiesWithDescriptionOf["true true true"]),
							".forEach(([k,v])=>{",
							this.path,
							"[k]=v;})"
						)
					);
				}
			} else {
				let descriptor = descriptionsText
					.split(" ")
					.map((value, ind) => {
						if (value == "true") return descriptionList[ind] + ":" + value;
					})
					.filter(Boolean)
					.join(",");
				if (propertiesWithDescriptionOf[descriptionsText].length < 3) {
					propertiesWithDescriptionOf[descriptionsText].forEach(
						([key, value]) => {
							let valuePath = this.path.addWithNewInitTime(key);
							let valueScript = this.getScript(value, valuePath);
							if (typeof key == "symbol") key = this.getScript(key);
							else key = JSON.stringify(key);
							this.addExpression([
								makeExpression(
									"Object.defineProperty(",
									this.path,
									",",
									key,
									",{value:",
									valueScript.popInit(),
									",",
									descriptor,
									"})"
								),
								valueScript
							]);
						}
					);
				} else {
					this.addExpression(
						makeExpression(
							this.getScript(propertiesWithDescriptionOf[descriptionsText]),
							".forEach(([k,v])=>{Object.defineProperty(",
							this.path,
							",k,{value:v,",
							descriptor,
							"});})"
						)
					);
				}
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
		let markSize = this.mark.size;
		let objScript = new ScriptClass(obj, this, path);
		if (path) return objScript;
		if (this.mark.size == markSize) {
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
		if (
			this.expressions.length == 1 &&
			this.expressions[0] instanceof ExpressionClass
		)
			return "(" + this.popInit() + ")";
		var str = "(function(){\n";
		let rawScript = this.getRawScript();
		if (!this.parent) {
			if (this.path.newName() != "_.a") str += ` const _={};\n`;
			str += ` var ${this.path};\n `;
		}
		str += rawScript;
		if (this.parent) str += `})()`;
		else str += `return ${this.path};\n})()`;
		return str;
	}

	/**
	 * join expression of this.expressions and return the script
	 * @method
	 */
	getRawScript() {
		var script = "";
		this.expressions.forEach(expr => {
			if (expr instanceof ExpressionClass && expr.isEmpty() == false)
				script += expr + ";\n ";
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
