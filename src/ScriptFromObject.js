var { classes: classesToScript, types: typesToScript } = require("./toScript");
var { isInstanceOf, PathClass, ExpressionClass } = require("./helper");
var makeExpression = ExpressionClass.prototype.makeExpression;

class ScriptClass {
	constructor(obj, parent, path) {
		this.getScript = this.getScript.bind(this);
		this.expressions = [];
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.path = path || new PathClass();
		} else {
			this.mark = new Map();
			this.path = new PathClass("obj");
			this.path.resetNameGenerator();
		}

		this.createExpressions(obj);
	}

	addExpression(expression, place) {
		if (typeof expression == "string") {
			this.addExpression(makeExpression(this.path, "=", expression), place);
			return;
		}
		if (
			expression instanceof ExpressionClass ||
			expression instanceof ScriptClass
		) {
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
			if (this.path.initTime > referencePath.initTime)
				this.addExpression(makeExpression(this.path, "=", referencePath));
			else
				this.addExpression([
					makeExpression(),
					makeExpression(this.path, "=", referencePath)
				]);
			return;
		}
		this.mark.set(obj, this.path);

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
					.filter(x => x)
					.join(",");
				if (propertiesWithDescriptionOf[descriptionsText].length < 3) {
					propertiesWithDescriptionOf[descriptionsText].forEach(
						([key, value]) => {
							if (typeof key == "symbol") key = this.getScript(key)[0];
							else key = JSON.stringify(key);
							let valuePath = this.path.addWithNewInitTime(key);
							let valueScript = this.getScript(value, valuePath);
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

	exportAsFunctionCall() {
		var str = "(function(){//version 1\n";
		if (!this.parent) str += ` const _={};\n var ${this.path};\n `;
		str += this.getRawScript();
		if (this.parent) str += ` })()`;
		else str += ` return ${this.path};\n})()`;
		return str;
	}

	getRawScript() {
		var script = "";
		this.expressions.forEach(expr => {
			if (expr instanceof ExpressionClass && expr.isEmpty() == false)
				script += expr + ";\n";
			if (expr instanceof ScriptClass) script += expr.getRawScript();
			if (typeof expr == "string") script += expr;
		});
		return script;
	}

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
