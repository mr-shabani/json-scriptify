var { classes: classesToScript, types: typesToScript } = require("./toScript");

class ScriptFromObject {
	constructor(obj, objName, parent) {
		this.circularExpressions = [];
		this.objectConstructors = [];
		this.parent = parent;
		if (parent) {
			this.mark = parent.mark;
			this.tempIndex = parent.tempIndex;
		} else {
			this.mark = new Map();
			this.tempIndex = 0;
		}
		this.objName = objName || "obj";

		this.objectSet = new WeakSet();
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
		if (value instanceof Array) return value;
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

		for (let cls of classesToScript) {
			if (this.isInstanceOf(cls.type, obj)) {
				var index = this.objectConstructors.length;
				var replacement = cls.toScript(obj, this.getScript.bind(this), path);
				if (typeof replacement == "string") {
					this.objectConstructors.push([path, replacement]);
				}
				if (typeof replacement == "object") {
					this.objectConstructors.splice(index, 0, [path, replacement.empty]);
					this.objectConstructors.push([replacement.add]);
				}
				this.makeScriptFromObjectProperties(obj, path);
			}
		}

		Object.entries(obj).forEach(([key, value]) => {
			if (String(parseInt(key)) == key && key != "NaN") key = parseInt(key);
			this.traverse(value, path + "[" + JSON.stringify(key) + "]");
		});
	}

	makeScriptFromObjectProperties(obj, path) {
		var objProperties = Object.entries(obj);
		if (obj.length)
			objProperties = objProperties.filter(([key, value]) => {
				return !(0 <= key && key < obj.length);
			});
		if (objProperties.length <= 2) {
			objProperties.forEach(([key, value]) => {
				this.objectConstructors.push([
					path + "[" + JSON.stringify(key) + "]",
					this.getScript(value)
				]);
			});
		} else {
			this.objectConstructors.push([
				`${this.getScript(objProperties)}.forEach(([k,v])=>{${path}[k]=v;})`
			]);
		}
	}

	getScript(obj) {
		let tempVarName = `temp[${this.tempIndex++}]`;
		let objScript = new ScriptFromObject(obj, tempVarName, this);
		this.objectConstructors.push([objScript.getRawScript()]);
		return tempVarName;
	}

	isInstanceOf(type, obj) {
		if (typeof type == "string") return typeof obj == type;
		if (obj instanceof type) return true;
		return false;
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
