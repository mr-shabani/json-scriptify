var { classes: classesToScript, types: typesToScript } = require("./toScript");

var addToPath = function(path, key) {
	const alphabetCheckRegexp = /^[A-Za-z_]+$/;
	if (String(parseInt(key)) == key && key != "NaN")
		return path + "[" + parseInt(key) + "]";
	if (alphabetCheckRegexp.test(key)) return path + "." + key;
	return path + "[" + JSON.stringify(key) + "]";
};

var isInstanceOf = function(type, obj) {
	if (typeof type == "string") return typeof obj == type;
	if (obj instanceof type) return true;
	return false;
};

class ScriptFromObject {
	constructor(obj, objName, parent) {
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

		this.stringified = JSON.stringify(obj, this.JsonReplacer.bind(this));

		this.traverse(obj, this.objName);
	}

	JsonReplacer(key, value) {
		for (let type of typesToScript) {
			if (type.isTypeOf(value)) return;
		}
		if (typeof value == "object") {
			if (this.objectSet.has(value)) {
				return;
			}
			this.objectSet.add(value);
		}
		for (let cls of classesToScript) {
			if (typeof cls.type == "function" && value instanceof cls.type) return;
		}
		return value;
	}

	traverse(obj, path) {
		for (let type of typesToScript) {
			if (type.isTypeOf(obj)) {
				const replacement = type.toScript(obj);
				this.objectConstructors.push([path, replacement]);
				return;
			}
		}

		if (!["object", "function", "symbol"].includes(typeof obj)) return;

		if (this.mark.has(obj)) {
			this.circularExpressions.push([path, this.mark.get(obj)]);
			return;
		}

		this.mark.set(obj, path);

		var ignoreProperties = [];
		for (let cls of classesToScript) {
			if (isInstanceOf(cls.type, obj)) {
				var index = this.objectConstructors.length;
				var expression = cls.toScript(obj, this.getScript.bind(this), path);
				ignoreProperties = cls.ignoreProperties || [];
				if (typeof expression == "string") {
					this.objectConstructors.push([path, expression]);
				}
				if (typeof expression == "function") {
					this.objectConstructors.push([expression(path)]);
				}
				if (expression instanceof Array) {
					expression.forEach(expr => {
						if (typeof expr == "string") {
							this.objectConstructors.push([path, expr]);
						}
						if (typeof expr == "function") {
							this.objectConstructors.push([expr(path)]);
						}
					});
				} else if (typeof expression == "object") {
					this.objectConstructors.splice(index, 0, [path, expression.empty]);
					this.objectConstructors.push([expression.add(path)]);
				}
			}
		}

		this.makeScriptFromObjectProperties(obj, path, ignoreProperties);
	}

	makeScriptFromObjectProperties(obj, path, ignoreProperties) {
		var allPropertyKeys = Object.getOwnPropertyNames(obj).concat(
			Object.getOwnPropertySymbols(obj)
		);

		var propertiesWithDescriptionOf = {};

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

		const descriptionList = ["enumerable", "writable", "configurable"];

		var allExistDescriptionsText = Object.keys(propertiesWithDescriptionOf);

		allExistDescriptionsText.forEach(descriptionsText => {
			if (descriptionsText == "true true true") {
				if (propertiesWithDescriptionOf["true true true"].length < 3) {
					propertiesWithDescriptionOf["true true true"].forEach(
						([key, value]) => {
							const pathScript =
								typeof key == "symbol"
									? path + "[" + this.getScript(key) + "]"
									: addToPath(path, key);
							const valueScript = this.getScript(value);
							this.objectConstructors.push([pathScript, valueScript]);
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
				if (objScript.circularExpressions.length == 0)
					return objScript.stringified;
				if (objScript.circularExpressions.length == 1)
					return objScript.circularExpressions[0][1];
			}
			if (objScript.circularExpressions.length == 0) {
				if (objScript.objectConstructors.length == 1)
					return objScript.objectConstructors[0][1];
			}
		}
		this.objectConstructors.push([objScript.getRawScript()]);
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

		if (this.parent) var str = "";
		else var str = " var temp=[];\n var";

		str += ` ${this.objName} = ` + this.stringified + ";";

		// str += "\n//Object constructors";
		this.objectConstructors.forEach(([path, code, addExpression]) => {
			if (addExpression) str += `\n ${path} = ${code}; ${addExpression}`;
			else if (code) str += `\n ${path} = ${code};`;
			else str += `\n ${path}`;
		});

		// str += "\n//Circular references";
		this.circularExpressions.forEach(([path, reference]) => {
			str += `\n ${path} = ${reference};`;
		});

		return str;
	}
}

module.exports = ScriptFromObject;
