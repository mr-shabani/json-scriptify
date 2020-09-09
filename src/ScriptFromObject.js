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
			if (isInstanceOf(cls.type, obj)) {
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
			this.traverse(value, addToPath(path, key));
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
				let valueScript = this.getScript(value);
				if (!this.mark.has(value))
					this.objectConstructors.push([addToPath(path, key), valueScript]);
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
