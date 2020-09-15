class NodePath {
	constructor(parentNode, key, isSymbol) {
		if (parentNode) this.parent = parentNode;
		if (isSymbol) this.isSymbol = true;
		this.key = key;
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
}

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
	NodePath
};
