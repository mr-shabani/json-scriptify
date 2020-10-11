/**
 * @type {string[]} array of alphabet characters a-z & A-Z
 * @constant
 */
const alphabet = [];
for (let ch = "a"; ch <= "z"; ch = String.fromCharCode(ch.charCodeAt(0) + 1))
	alphabet.push(ch);
for (let ch = "A"; ch <= "Z"; ch = String.fromCharCode(ch.charCodeAt(0) + 1))
	alphabet.push(ch);

/**
 * convert number to string of alphabets
 * @param {number} num
 * @returns {string}
 */
var numberToAlphabetString = function(num) {
	let alphabetString = alphabet[num % alphabet.length];
	num = Math.floor(num / alphabet.length);
	while (num) {
		alphabetString += alphabet[num % alphabet.length];
		num = Math.floor(num / alphabet.length);
	}
	return alphabetString;
};

/**
 * @generator VariableNameGenerator
 * @yields {string} the next free variable name
 */
var VariableNameGenerator = function*() {
	let keyNumber = 0;
	while (true) yield "_." + numberToAlphabetString(keyNumber++);
};

/**
 * class to keep variable name and variable path to main object
 * @class
 */
class PathClass {
	/**
	 * @param {string} [key] string of variable name or key
	 * @param {PathClass} [parentNode] parent variable path that contain this variable
	 * @param {boolean} [isSymbol] key is symbol or not
	 */
	constructor(key, parentNode, isSymbol) {
		if (parentNode) {
			/** @type {PathClass} */
			this.parent = parentNode;
			/** @type {number} initial time of making the expression*/
			this.initTime = parentNode.initTime;
			/** @type {Object} shared items between all paths */
			this.shared = parentNode.shared;
		}
		if (isSymbol)
			/** type {boolean} key is symbol or not */ this.isSymbol = true;
		if (typeof key != "undefined")
			/** @type {string} string of variable name or key */ this.key = key;
	}
	/** make a new path with the same shared items */
	newPath() {
		let newPath = new PathClass(...arguments);
		newPath.getSharedItems(this);
		return newPath;
	}
	/**
	 * make a new path with the same shared items and new init time
	 * that be child of this path
	 * @param {(string|symbol)} key
	 * @param {function} getScript
	 */
	addWithNewInitTime(key, getScript) {
		let newPath = this.add(key, getScript);
		newPath.initTime = ++this.shared.lastInitTime;
		return newPath;
	}
	/**
	 * make a new path with the same shared items
	 * that be child of this path
	 * @param {(string|symbol)} key
	 * @param {function} getScript
	 */
	add(key, getScript) {
		var newPath;
		if (typeof key == "symbol") {
			key = getScript(key);
			newPath = new PathClass(key, this, true);
		} else newPath = new PathClass(key, this);

		return newPath;
	}
	toString() {
		if (this.parent) return this.addToPath(this.parent.toString(), this.key);
		if (typeof this.key != "undefined") return this.key;
		this.key = this.newName();
		return this.key;
	}
	/**
	 * based on isSymbol and keyText generate new path
	 * @param {string} pathText
	 * @param {string} keyText
	 */
	addToPath(pathText, keyText) {
		if (this.isSymbol) return pathText + "[" + keyText + "]";
		const alphabetCheckRegexp = /^[A-Za-z_]+[A-Za-z0-9_]*$/;
		if (String(parseInt(keyText)) == keyText && keyText != "NaN")
			return pathText + "[" + parseInt(keyText) + "]";
		if (alphabetCheckRegexp.test(keyText)) return pathText + "." + keyText;
		return pathText + "[" + JSON.stringify(keyText) + "]";
	}
	/** generate new free variable name */
	newName() {
		return this.shared.varNameGen.next().value;
	}
	newSharedItems() {
		this.shared = { varNameGen: VariableNameGenerator(), lastInitTime: 0 };
		this.initTime = ++this.shared.lastInitTime;
	}
	/**
	 * check that this path has less initTime
	 * @param {PathClass} path
	 */
	isBefore(path) {
		return this.initTime < path.initTime;
	}
	getNewInitTime() {
		return ++this.shared.lastInitTime;
	}
	/**
	 * copy shared items from a path to this
	 * @param {PathClass} path
	 */
	getSharedItems(path) {
		this.shared = path.shared;
		if (typeof this.initTime == "undefined")
			this.initTime = ++this.shared.lastInitTime;
	}
}

module.exports = PathClass;
