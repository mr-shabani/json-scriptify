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

class PathClass {
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
	addWithNewInitTime(key, getScript) {
		let newPath = this.add(key, getScript);
		newPath.initTime = ++lastInitTime;
		return newPath;
	}
	add(key, getScript) {
		if (typeof key == "symbol") {
			key = getScript(key);
			var newPath = new PathClass(key, this, true);
		} else var newPath = new PathClass(key, this);

		return newPath;
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

module.exports = PathClass;