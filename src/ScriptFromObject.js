var { classes: classesToScript, types: typesToScript } = require("./toScript");
var { isInstanceOf, NodePath } = require("./helper");
class ScriptFromObject {
	constructor(obj, parent) {
		this.getScript = this.getScript.bind(this);
		this.expressions = [];
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.path = new NodePath();
		} else {
			this.mark = new Map();
			this.path = new NodePath(null, "obj");
			this.path.resetNameGenerator();
		}

		this.makeExpressions(obj, this.path);
	}

	makeExpressions(obj, path) {
		for (let type of typesToScript) {
			if (type.isTypeOf(obj)) {
				const replacement = type.toScript(obj);
				this.expressions.push([path, "=", replacement]);
				return;
			}
		}

		if (!["object", "function", "symbol"].includes(typeof obj)) return;

		if (this.mark.has(obj)) {
			let referencePath = this.mark.get(obj);
			path.makeCircularTo(referencePath);
			this.expressions.push([path, "=", referencePath]);
			return;
		}
		this.mark.set(obj, path);

		var ignoreProperties = [];
		for (let cls of classesToScript) {
			if (isInstanceOf(cls.type, obj)) {
				var index = this.expressions.length;
				var expression = cls.toScript(obj, this.getScript, path);
				ignoreProperties = cls.ignoreProperties || [];
				if (expression instanceof Array == false) expression = [expression];
				expression.forEach(expr => {
					if (typeof expr == "string") {
						this.expressions.push([path, "=", ...expr]);
					} else if (expr instanceof Array) {
						this.expressions.push(expr);
					} else if (typeof expr == "object") {
						this.expressions.splice(index, 0, [path, "=", expr.empty]);
						if (expr.add instanceof Array == false) expr.add = [expr.add];
						expr.add.forEach(addExpr => {
							this.expressions.push(addExpr);
						});
					}
				});
				break;
			}
		}

		this.makeScriptFromObjectProperties(obj, path, ignoreProperties);
	}

	makeScriptFromObjectProperties(obj, path, ignoreProperties) {
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
							const newPath = path.add(key, this.getScript);
							this.expressions.push([newPath, "=", this.getScript(value)]);
						}
					);
				} else {
					this.expressions.push([
						this.getScript(propertiesWithDescriptionOf["true true true"]),
						".forEach(([k,v])=>{",
						path,
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
							if (typeof key == "symbol") key = this.getScript(key);
							else key = JSON.stringify(key);
							const addPropertyScript = [
								"Object.defineProperty(",
								path,
								",",
								key,
								",{value:",
								this.getScript(value),
								",",
								descriptor,
								"})"
							];
							this.expressions.push(addPropertyScript);
						}
					);
				} else {
					this.expressions.push([
						this.getScript(propertiesWithDescriptionOf[descriptionsText]),
						".forEach(([k,v])=>{Object.defineProperty(",
						path,
						",k,{value:v,",
						descriptor,
						"});})"
					]);
				}
			}
		});
	}

	getScript(obj) {
		let markSize = this.mark.size;
		let objScript = new ScriptFromObject(obj, this);
		if (this.mark.size == markSize) {
			if (objScript.expressions.length == 1) {
				return objScript.expressions[0][2];
			}
		}
		this.expressions.push(...objScript.expressions);
		return objScript.path;
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

		str += this.expressions.map(expr => expr.join("")).join(";\n ");

		return str;
	}
}

module.exports = ScriptFromObject;
