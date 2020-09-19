var VariableNameGenerator = function*() {
	let varName = ["a"];
	var charCode;
	var plusPlus = function() {
		let length = varName.length;
		var addition = true;
		for (let i = 0; i < length; ++i) {
			if (!addition) break;
			if (varName[i] == "Z") {
				varName[i] = "a";
			} else {
				if (varName[i] == "z") varName[i] = "A";
				else {
					charCode = varName[i].charCodeAt(0);
					varName[i] = String.fromCharCode(charCode + 1);
				}
				addition = false;
			}
		}
		if (addition) varName.push("a");
	};
	while (true) {
		yield "_." + varName.join("");
		plusPlus();
	}
};

var varNameGen = VariableNameGenerator();

var lastInitTime = 0;

class NodePath {
	constructor(key, parentNode, isSymbol) {
		if (parentNode) {
			this.parent = parentNode;
			this.initTime = parentNode.initTime;
		} else {
			this.initTime = ++lastInitTime;
		}
		if (isSymbol) this.isSymbol = true;
		if (typeof key != "undefined") this.key = key;
	}
	addCircularCite(nodePath) {
		if (this.circularCitedChild) this.circularCitedChild.push(nodePath);
		else this.circularCitedChild = [nodePath];
	}
	makeCircularTo(circularReference) {
		this.isCircular = true;
		this.circularReference = circularReference;
		circularReference.addCircularCite(this);
	}
	addWithNewInitTime(key, getScript) {
		let newPath = this.add(key, getScript);
		newPath.initTime = ++lastInitTime;
		return newPath;
	}
	add(key, getScript) {
		if (typeof key == "symbol") {
			key = getScript(key)[0];
			var new_child = new NodePath(key, this, true);
		} else var new_child = new NodePath(key, this);

		if (this.child) this.child.push(new_child);
		else this.child = [new_child];

		return new_child;
	}
	toString() {
		if (this.parent) return this.addToPath(this.parent.toString(), this.key);
		if (typeof this.key != "undefined") return this.key;
		this.key = this.newName();
		return this.key;
	}
	addToPath(pathText, keyText) {
		if (this.isSymbol) return pathText + "[" + keyText + "]";
		const alphabetCheckRegexp = /^[A-Za-z_]+[A-Za-z0-9_]*$/;
		if (String(parseInt(keyText)) == keyText && keyText != "NaN")
			return pathText + "[" + parseInt(keyText) + "]";
		if (alphabetCheckRegexp.test(keyText)) return pathText + "." + keyText;
		return pathText + "[" + JSON.stringify(keyText) + "]";
	}
	newName() {
		return varNameGen.next().value;
	}
	resetNameGenerator() {
		varNameGen = VariableNameGenerator();
		lastInitTime = 0;
		this.initTime = ++lastInitTime;
	}
}

var cleanKey = function(keyText) {
	if (String(parseInt(keyText)) == keyText && keyText != "NaN")
		return parseInt(keyText);
	const alphabetCheckRegexp = /^[A-Za-z_]+[A-Za-z0-9_]*$/;
	if (alphabetCheckRegexp.test(keyText)) return keyText;
	return JSON.stringify(keyText);
};

var isInstanceOf = function(type, obj) {
	if (typeof type == "string") return typeof obj == type;
	if (obj instanceof type) return true;
	return false;
};
var isEmptyObject = function(obj) {
	if (typeof obj != "object") return false;
	if (Object.is(obj, null)) return false;
	if (obj.__proto__ !== Object.prototype) return false;
	if (Object.getOwnPropertyNames(obj).length > 0) return false;
	if (Object.getOwnPropertySymbols(obj).length > 0) return false;
	return true;
};
var objectHasOnly = function(obj, props) {
	if (typeof obj != "object") return false;
	if (Object.is(obj, null)) return false;
	if (obj.__proto__ !== Object.prototype) return false;
	if (Object.getOwnPropertyNames(obj).some(key => obj[key] != props[key]))
		return false;
	if (Object.getOwnPropertySymbols(obj).some(key => obj[key] != props[key]))
		return false;
	return true;
};

var getSameProperties = function(obj, script) {
	eval(`
			var PleaseDoNotUseThisNameThatReservedForScriptifyModule = ${script}
			`);
	const evaluated_obj = PleaseDoNotUseThisNameThatReservedForScriptifyModule;
	var sameProperties = Object.getOwnPropertyNames(evaluated_obj).filter(key => {
		if (!(isEmptyObject(obj[key]) && isEmptyObject(evaluated_obj[key]))) {
			if (
				obj[key] !== evaluated_obj[key] &&
				!Object.is(evaluated_obj[key], obj[key])
			)
				return false;
		}
		let descriptor_evalObj = Object.getOwnPropertyDescriptor(
			evaluated_obj,
			key
		);
		let descriptor_obj = Object.getOwnPropertyDescriptor(obj, key);
		return (
			descriptor_evalObj.writable == descriptor_obj.writable &&
			descriptor_evalObj.configurable == descriptor_obj.configurable &&
			descriptor_evalObj.enumerable == descriptor_obj.enumerable
		);
	});
	return sameProperties;
};

var insertBetween = function(arr, val) {
	let newArray = [];
	if (arguments.length == 2) {
		arr.forEach(element => {
			if (element instanceof Array)
				newArray.push(...insertBetween(element), val);
			else newArray.push(element, val);
		});
		newArray.pop();
	} else {
		arr.forEach(element => {
			if (element instanceof Array) newArray.push(...insertBetween(element));
			else newArray.push(element);
		});
	}
	return newArray;
};

module.exports = {
	isInstanceOf,
	getSameProperties,
	objectHasOnly,
	NodePath,
	cleanKey,
	insertBetween
};
