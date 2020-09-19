var { classes: classesToScript, types: typesToScript } = require("./toScript");
var { isInstanceOf, NodePath, insertBetween } = require("./helper");
class ScriptFromObject {
	constructor(obj, parent, path) {
		this.getScript = this.getScript.bind(this);
		this.expressions = [];
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.path = path || new NodePath();
		} else {
			this.mark = new Map();
			this.path = new NodePath("obj");
			this.path.resetNameGenerator();
		}

		this.makeExpressions(obj);
	}

	addExpression(expression, place) {
		if (typeof expression == "string") {
			if (typeof place == "number")
				this.expressions.splice(place, 0, [this.path, "=", expression]);
			else this.expressions.push([this.path, "=", expression]);
			return;
		}
		if (expression instanceof Array) {
			if (typeof place == "number")
				this.expressions.splice(place, 0, expression);
			else this.expressions.push(expression);
			return;
		}
		if (typeof expression == "object") {
			if (expression.init) {
				expression.init.forEach((expr, index) => {
					this.addExpression(expr, index);
				});
			}
			if (expression.add)
				expression.add.forEach(expr => {
					this.addExpression(expr);
				});
		}
	}

	makeExpressions(obj) {
		for (let type of typesToScript) {
			if (type.isTypeOf(obj)) {
				this.addExpression(type.toScript(obj));
				return;
			}
		}

		if (!["object", "function", "symbol"].includes(typeof obj)) return;

		if (this.mark.has(obj)) {
			let referencePath = this.mark.get(obj);
			this.path.makeCircularTo(referencePath);
			if (this.path.initTime > referencePath.initTime)
				this.addExpression([this.path, "=", referencePath]);
			else this.addExpression({ add: [[], [this.path, "=", referencePath]] });
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
							const newPath = this.path.addWithNewInitTime(key, this.getScript);
							let place = this.expressions.length;
							this.addExpression(
								[newPath, "=", ...this.getScript(value, newPath)],
								place
							);
						}
					);
				} else {
					this.addExpression([
						...this.getScript(propertiesWithDescriptionOf["true true true"]),
						".forEach(([k,v])=>{",
						this.path,
						"[k]=v;})"
					]);
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
							let newPath = this.path.addWithNewInitTime(key);
							if (typeof key == "symbol") key = this.getScript(key)[0];
							else key = JSON.stringify(key);
							let place = this.expressions.length;
							this.addExpression(
								[
									"Object.defineProperty(",
									this.path,
									",",
									key,
									",{value:",
									...this.getScript(value, newPath),
									",",
									descriptor,
									"})"
								],
								place
							);
						}
					);
				} else {
					this.addExpression([
						...this.getScript(propertiesWithDescriptionOf[descriptionsText]),
						".forEach(([k,v])=>{Object.defineProperty(",
						this.path,
						",k,{value:v,",
						descriptor,
						"});})"
					]);
				}
			}
		});
	}

	getScript(obj, path) {
		let markSize = this.mark.size;
		let objScript = new ScriptFromObject(obj, this, path);
		if (this.mark.size == markSize) {
			if (objScript.expressions.length == 1) {
				return objScript.expressions[0].slice(2);
			}
		}
		if (path) {
			let initExpression = objScript.expressions.shift();
			this.addExpression({ add: objScript.expressions });
			return initExpression.slice(2);
		}
		this.addExpression({ add: objScript.expressions });
		return [objScript.path];
	}

	exportAsFunctionCall(options) {
		var str = "(function(){//version 1\n";
		str += this.getRawScript(options);
		if (this.parent) str += `\n })()`;
		else str += `\n return ${this.path};\n})()`;
		return str;
	}

	getRawScript(options) {
		options = options || {};

		var str = "";
		if (!this.parent) {
			str += ` const _={};\n var ${this.path};\n `;
		}

		str += this.expressions
			.map(expr => insertBetween(expr).join(""))
			.join(";\n ");

		return str;
	}
}

module.exports = ScriptFromObject;
