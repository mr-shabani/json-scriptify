var classesToScript = require("./toScript");

class ScriptFromObject {
	constructor(obj, objName, parent) {
		this.circularExpressions = [];
		this.objectConstructors = [];
		this.functionsList = [];
		this.tabSpace = " ";
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.tempIndex = parent.tempIndex;
			this.tabSpace = parent.tabSpace + "\t";
		} else {
			this.mark = new Map();
			this.tempIndex = 0;
		}
		this.obj = obj;
		this.objName = objName || "obj";
	}

	getScript(obj) {
		let tempVarName = `temp[${this.tempIndex++}]`;
		let objScript = new ScriptFromObject(obj, tempVarName, this);
		this.objectConstructors.push([objScript.exportAsFunctionCall() + ";"]);
		return tempVarName;
	}

	traverse(obj, path) {
		if (typeof obj == "function") {
			this.functionsList.push([path, obj.toString()]);
			return;
		}
		if (typeof obj == "bigint") {
			this.objectConstructors.push([path, `BigInt(${obj.toString()})`]);
			return;
		}

		if (typeof obj != "object") return;

		if (this.mark.has(obj)) {
			this.circularExpressions.push([path, this.mark.get(obj)]);
			return;
		}
		this.mark.set(obj, path);

		for (let cls of classesToScript) {
			if (obj instanceof cls.type) {
				var index = this.objectConstructors.length;
				var replacement = cls.toScript(obj, this.getScript.bind(this), path);
				if (typeof replacement == "string") {
					this.objectConstructors.push([path, replacement]);
					return;
				}
				if (typeof replacement == "object") {
					this.objectConstructors.splice(index, 0, [path, replacement.empty]);
					this.objectConstructors.push([replacement.add]);
					return;
				}
			}
		}

		Object.entries(obj).forEach(([key, value]) => {
			this.traverse(value, path + "[" + JSON.stringify(key) + "]");
		});
	}

	JsonReplacer(key, value) {
		if (typeof value == "object") {
			if (this.objectSet.has(value)) {
				return;
			}
			this.objectSet.add(value);
		}
		if (typeof value == "bigint") return;
		for (let cls of classesToScript) {
			if (value instanceof cls.type) return;
		}
		return value;
	}

	exportAsFunctionCall(options) {
		var str = "(function(){//version 1\n";
		str += this.getRawScript(this.objName, options);
		let parentTabSpace = this.parent ? this.parent.tabSpace : " ";
		if (this.parent) str += `\n${parentTabSpace}})()`;
		else str += `\n${parentTabSpace}return ${this.objName};\n})()`;
		return str;
	}

	getRawScript(varName, options) {
		options = options || {};

		this.objectSet = new Set();

		this.traverse(this.obj, varName);

		if (this.parent) {
			var str = "";
		} else {
			var str = " var temp=[];\n var";
		}

		str +=
			` ${this.tabSpace}${varName} = ` +
			JSON.stringify(this.obj, this.JsonReplacer.bind(this)) +
			";";

		// str += "\n//Circular references";
		this.circularExpressions.forEach(([path, reference]) => {
			str += `\n${this.tabSpace}${path} = ${reference};`;
		});

		// str += "\n//Object constructors";
		this.objectConstructors.forEach(([path, code, addExpression]) => {
			if (addExpression)
				str += `\n${this.tabSpace}${path} = ${code}; ${addExpression}`;
			else if (code) str += `\n${this.tabSpace}${path} = ${code};`;
			else str += `\n${this.tabSpace}${path}`;
		});

		if (options.withAllFunctions) {
			// str += "\n//Functions";
			this.functionsList.forEach(([path, code]) => {
				str += `\n${this.tabSpace}${path} = ${code};`;
			});
		}
		return str;
	}
}

module.exports = ScriptFromObject;
