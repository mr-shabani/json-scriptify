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

class NodePath {
	constructor(parentNode, key, isSymbol) {
		if (parentNode) this.parent = parentNode;
		if (isSymbol) this.isSymbol = true;
		if (key) this.key = key;
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
	add(key, getScript) {
		if (typeof key == "symbol") {
			key = getScript(key);
			var new_child = new NodePath(this, key, true);
		} else var new_child = new NodePath(this, key);

		if (this.child) this.child.push(new_child);
		else this.child = [new_child];

		return new_child;
	}
	toString() {
		if (this.parent) return this.addToPath(this.parent.toString(), this.key);
		if (this.key) return this.key;
		this.key = this.newName();
		return this.key;
	}
	addToPath(pathText, keyText) {
		if (this.isSymbol) return pathText + "[" + keyText + "]";
		const alphabetCheckRegexp = /^[A-Za-z_]+$/;
		if (String(parseInt(keyText)) == keyText && keyText != "NaN")
			return pathText + "[" + parseInt(keyText) + "]";
		if (alphabetCheckRegexp.test(keyText)) return pathText + "." + keyText;
		return pathText + "[" + JSON.stringify(keyText) + "]";
	}

	newName() {
		return varNameGen.next().value;
	}
	resetNameGenerator(){
		varNameGen = VariableNameGenerator();
	}
}

var cleanKey = function(keyText) {
	if (String(parseInt(keyText)) == keyText && keyText != "NaN")
		return parseInt(keyText);
	const alphabetCheckRegexp = /^[A-Za-z_]+$/;
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

module.exports = {
	isInstanceOf,
	isEmptyObject,
	objectHasOnly,
	NodePath,
	cleanKey
};
