var { classes: classesToScript, types: typesToScript } = require("./toScript");

class ScriptFromObject {
	constructor(obj, objName, parent) {
		this.circularExpressions = [];
		this.objectConstructors = [];
		this.functionsList = [];
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.tempIndex = parent.tempIndex;
		} else {
			this.mark = new WeakMap();
			this.tempIndex = 0;
		}
		this.objName = objName || "obj";

		this.objectSet = new WeakSet();
		this.stringified = JSON.stringify(obj, this.JsonReplacer.bind(this));

		this.traverse(obj, this.objName);
	}

	JsonReplacer(key, value) {
		for (let type of typesToScript) {
			if (type.is(value)) return;
		}
		if (typeof value == "object") {
			if (this.objectSet.has(value)) {
				return;
			}
			this.objectSet.add(value);
		}
		for (let cls of classesToScript) {
			if (value instanceof cls.type) return;
		}
		return value;
	}

	traverse(obj, path) {
		for (let type of typesToScript) {
			if (type.is(obj)) {
				const replacement = type.toScript(obj);
				this.objectConstructors.push([path, replacement]);
				return;
			}
		}
		if (typeof obj == "function") {
			this.functionsList.push([path, obj.toString()]);
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

		if (obj instanceof Array) {
			obj.forEach((value, index) => {
				this.traverse(value, path + "[" + index + "]");
			});
		} else {
			Object.entries(obj).forEach(([key, value]) => {
				this.traverse(value, path + "[" + JSON.stringify(key) + "]");
			});
		}
	}

	getScript(obj) {
		let tempVarName = `temp[${this.tempIndex++}]`;
		let objScript = new ScriptFromObject(obj, tempVarName, this);
		this.objectConstructors.push([objScript.getRawScript()]);
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

		// str += "\n//Circular references";
		this.circularExpressions.forEach(([path, reference]) => {
			str += `\n ${path} = ${reference};`;
		});

		// str += "\n//Object constructors";
		this.objectConstructors.forEach(([path, code, addExpression]) => {
			if (addExpression) str += `\n ${path} = ${code}; ${addExpression}`;
			else if (code) str += `\n ${path} = ${code};`;
			else str += `\n ${path}`;
		});

		if (options.withAllFunctions) {
			// str += "\n//Functions";
			this.functionsList.forEach(([path, code]) => {
				str += `\n ${path} = ${code};`;
			});
		}
		return str;
	}
}

module.exports = ScriptFromObject;
