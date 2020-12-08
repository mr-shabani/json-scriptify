"use strict";
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
const numberToAlphabetString = function(num) {
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
const VariableNameGenerator = function*() {
	let keyNumber = 0;
	while (true) yield "_." + numberToAlphabetString(keyNumber++);
};

/**
 * class to keep variable name and variable path to main object
 * @class
 */
class PathClass {
	/**
	 * @param {string|PathClass} [key] string of variable name or key
	 * @param {PathClass} [parentNode] parent variable path that contain this variable
	 */
	constructor(key, parentNode) {
		if (parentNode) {
			/** @type {PathClass} */
			this.parent = parentNode;
			/** @type {number} initial time of making the expression*/
			this.initTime = parentNode.initTime;
			/** @type {Object} shared items between all paths */
			this.shared = parentNode.shared;
		}
		if (typeof key == "string" || (typeof key == "object" && key != null))
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
	 * that be the same of this path
	 */
	cloneWithNewInitTime() {
		let newPath;
		if (this.key) newPath = new PathClass(this.key, this.parent);
		else newPath = new PathClass(this.key, this);
		newPath.getSharedItems(this);
		newPath.initTime = this._getNewInitTime();
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
		newPath.initTime = this._getNewInitTime();
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
			newPath = new PathClass(key, this);
		} else newPath = new PathClass(key, this);

		return newPath;
	}
	toString() {
		if (this.parent) {
			if (this.key == undefined) return this.parent.toString();
			return this._addKeyToPathText(this.parent.toString(), this.key);
		}
		if (typeof this.key == "object") return this.key.toString();
		if (typeof this.key == "string") return this.key;
		this.key = this._newName();
		return this.key;
	}
	/**
	 * based on pathText and keyText generate new path
	 * @param {string} pathText
	 * @param {string} keyText
	 */
	_addKeyToPathText(pathText, keyText) {
		if (typeof keyText != "string") return pathText + "[" + keyText + "]";
		const alphabetCheckRegexp = /^[A-Za-z_][A-Za-z0-9_]*$/;
		if (String(parseInt(keyText)) == keyText && keyText != "NaN")
			return pathText + "[" + parseInt(keyText) + "]";
		if (alphabetCheckRegexp.test(keyText)) return pathText + "." + keyText;
		return pathText + "[" + JSON.stringify(keyText) + "]";
	}
	/** generate new free variable name */
	_newName() {
		return this.shared.varNameGen.next().value;
	}
	newSharedItems() {
		this.shared = { varNameGen: VariableNameGenerator(), lastInitTime: 0 };
		this.initTime = ++this.shared.lastInitTime;
	}
	/**
	 * check that this path has initialized before argument path.
	 * @param {PathClass} path
	 */
	isBefore(path) {
		return this.initTime < path.initTime;
	}
	/**
	 * check that this path has initialized before argument path or 
	 * at the same time.
	 * @param {PathClass} path
	 */
	isNotAfter(path) {
		return this.initTime <= path.initTime;
	}
	_getNewInitTime() {
		return ++this.shared.lastInitTime;
	}
	/**
	 * copy shared items from a path to this
	 * @param {PathClass} path
	 */
	getSharedItems(path) {
		this.shared = path.shared;
		if (typeof this.initTime == "undefined")
			this.initTime = this._getNewInitTime();
	}
}

module.exports = PathClass;
