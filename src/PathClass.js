const alphabet = [];
for (let ch = "a"; ch <= "z"; ch = String.fromCharCode(ch.charCodeAt(0) + 1))
	alphabet.push(ch);
for (let ch = "A"; ch <= "Z"; ch = String.fromCharCode(ch.charCodeAt(0) + 1))
	alphabet.push(ch);

var numberToAlphabetString = function(num) {
	let alphabetString = alphabet[num % alphabet.length];
	num = Math.floor(num / alphabet.length);
	while (num) {
		alphabetString += alphabet[num % alphabet.length];
		num = Math.floor(num / alphabet.length);
	}
	return alphabetString;
};

var VariableNameGenerator = function*() {
	let keyNumber = 0;
	while (true) yield "_." + numberToAlphabetString(keyNumber++);
};

class PathClass {
	constructor(key, parentNode, isSymbol) {
		if (parentNode) {
			this.parent = parentNode;
			this.initTime = parentNode.initTime;
			this.shared = parentNode.shared;
		}
		if (isSymbol) this.isSymbol = true;
		if (typeof key != "undefined") this.key = key;
	}
	addWithNewInitTime(key, getScript) {
		let newPath = this.add(key, getScript);
		newPath.initTime = ++this.shared.lastInitTime;
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
		return this.shared.varNameGen.next().value;
	}
	newSharedItems() {
		this.shared = { varNameGen: VariableNameGenerator(), lastInitTime: 0 };
		this.initTime = ++this.shared.lastInitTime;
	}
	isBefore(path) {
		return this.initTime < path.initTime;
	}
	getNewInitTime() {
		return ++this.shared.lastInitTime;
	}
	getSharedItems(path) {
		this.shared = path.shared;
		if (typeof this.initTime == "undefined")
			this.initTime = ++this.shared.lastInitTime;
	}
}

module.exports = PathClass;
