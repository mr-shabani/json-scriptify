var { classes: classesToScript, types: typesToScript } = require("./toScript");
var { isInstanceOf, NodePath } = require("./helper");
class ScriptFromObject {
	constructor(obj, objName, parent) {
		this.getScript = this.getScript.bind(this);
		this.circularExpressions = [];
		this.objectConstructors = [];
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.tempIndex = parent.tempIndex;
			this.objectSet = new WeakSet(
				Array.from(this.mark)
					.map(([object, path]) => object)
					.filter(object => typeof object == "object")
			);
		} else {
			this.mark = new Map();
			this.tempIndex = 0;
			this.objectSet = new WeakSet();
		}
		this.objName = objName || "obj";
		this.path = new NodePath(null, this.objName);

		this.makeExpressions(obj, this.path);
	}

	makeExpressions(obj, path) {
		for (let type of typesToScript) {
			if (type.isTypeOf(obj)) {
				const replacement = type.toScript(obj);
				this.objectConstructors.push([path, replacement]);
				return;
			}
		}

		if (!["object", "function", "symbol"].includes(typeof obj)) return;

		if (this.mark.has(obj)) {
			let referencePath = this.mark.get(obj);
			path.makeCircularTo(referencePath);
			this.circularExpressions.push([path, referencePath]);
			return;
		}
		this.mark.set(obj, path);

		var ignoreProperties = [];
		for (let cls of classesToScript) {
			if (isInstanceOf(cls.type, obj)) {
				var index = this.objectConstructors.length;
				var expression = cls.toScript(obj, this.getScript, path);
				ignoreProperties = cls.ignoreProperties || [];
				if (expression instanceof Array == false) expression = [expression];
				expression.forEach(expr => {
					if (typeof expr == "object") {
						this.objectConstructors.splice(index, 0, [path, expr.empty]);
						if (expr.add instanceof Array == false) expr.add = [expr.add];
						expr.add.forEach(addExpr => {
							this.objectConstructors.push([path, addExpr]);
						});
					} else this.objectConstructors.push([path, expr]);
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
							const valueScript = this.getScript(value);
							this.objectConstructors.push([newPath, valueScript]);
						}
					);
				} else {
					this.objectConstructors.push([
						`${this.getScript(
							propertiesWithDescriptionOf["true true true"]
						)}.forEach(([k,v])=>{${path}[k]=v;})`
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
							const valueScript = this.getScript(value);
							const addPropertyScript =
								typeof key == "symbol"
									? `Object.defineProperty(${path},${this.getScript(
											key
									  )},{value:${valueScript},${descriptor}})`
									: `Object.defineProperty(${path},'${key}',{value:${valueScript},${descriptor}})`;
							this.objectConstructors.push([addPropertyScript]);
						}
					);
				} else {
					this.objectConstructors.push([
						`${this.getScript(
							propertiesWithDescriptionOf[descriptionsText]
						)}.forEach(([k,v])=>{Object.defineProperty(${path},k,{value:v,${descriptor}});})`
					]);
				}
			}
		});
	}

	getScript(obj) {
		let markSize = this.mark.size;
		let tempVarName = `temp[${this.tempIndex++}]`;
		let objScript = new ScriptFromObject(obj, tempVarName, this);
		if (this.mark.size == markSize) {
			if (objScript.objectConstructors.length == 0) {
				if (objScript.circularExpressions.length == 1)
					return objScript.circularExpressions[0][1];
			}
			if (objScript.circularExpressions.length == 0) {
				if (objScript.objectConstructors.length == 1)
					return objScript.objectConstructors[0][1];
			}
		}
		this.objectConstructors.push(...objScript.objectConstructors);
		this.objectConstructors.push(...objScript.circularExpressions);
		this.tempIndex = objScript.tempIndex;
		return tempVarName;
	}

	exportAsFunctionCall(options) {
		var str = "(function(){//version 1\n";
		str += this.getRawScript(options);
		if (this.parent) str += `\n })()`;
		else str += `\n return ${this.objName};\n})()`;
		return str;
	}

	getRawScript(options) {
		options = options || {};

		var str = "";
		if (!this.parent) {
			str += ` var temp=[];\n var ${this.objName};`;
		}

		// str += "//Object constructors\n";
		this.objectConstructors.forEach(([path, expression]) => {
			if (typeof expression == "string") str += `\n${path} = ${expression};`;
			else if (typeof expression == "function") str += `\n${expression(path)};`;
			else if (expression instanceof NodePath)
				str += `\n${path} = ${expression};`;
			else str += `\n${path};`;
		});

		// str += "//Circular references\n";
		this.circularExpressions.forEach(([path, reference]) => {
			str += `\n${path} = ${reference};`;
		});

		return str;
	}
}

module.exports = ScriptFromObject;
