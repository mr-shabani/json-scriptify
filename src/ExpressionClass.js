"use strict";
/**
 * if arr  includes any array the content of that array will be inserted in arr
 * and that array will be removed from arr.
 *
 * @param {Array} arr Array of expressions
 * @returns {Array} newArray One array that does not include any array
 */
const makeFlat = function(arr) {
	let newArray = [];
	arr.forEach(element => {
		if (element instanceof Array) newArray.push(...makeFlat(element));
		else newArray.push(element);
	});
	return newArray;
};

/**
 * A class to keep one expression elements. It consist an array of expression.
 * Each element of this array may be also a ExpressionClass instance.
 * @class
 */
class ExpressionClass {
	/**
	 * @param {...(string|ExpressionClass)} expression elements
	 */
	constructor(...args) {
		/** @type {Array.<(string|ExpressionClass)>} array of elements in the expression */
		this.expressions = makeFlat(args);
	}
	toString() {
		return this.expressions.join("");
	}
	/** construct a new Expression class and return it. */
	makeExpression(...args) {
		return new ExpressionClass(...args);
	}
	/** remove elements and characters before the first '=' character and also first '='.*/
	removeAssignment() {
		while (this.expressions.length > 0) {
			if (typeof this.expressions[0] != "string") {
				this.expressions.shift();
			} else {
				let index = this.expressions[0].indexOf("=");
				if (index < 0) {
					this.expressions.shift();
				} else {
					this.expressions[0] = this.expressions[0].slice(index + 1);
					if (this.expressions[0].length == 0) this.expressions.shift();
					break;
				}
			}
		}
		return this;
	}
	isEmpty() {
		return this.expressions.length == 0;
	}
	/**
	 * The initTime of an expression is defined as maximum initTime of its elements.
	 */
	get initTime() {
		let initTime = 0;
		this.expressions.forEach(expr => {
			// eslint-disable-next-line no-prototype-builtins
			if (typeof expr == "object" && expr.hasOwnProperty("initTime"))
				if (initTime < expr.initTime) initTime = expr.initTime;
		});
		return initTime;
	}
	hasDeterminateString() {
		return this.expressions.every(value => {
			if (typeof value == "string") return true;
			if ("hasDeterminateString" in value) return value.hasDeterminateString();
			return false;
		});
	}
}

module.exports = { makeFlat, ExpressionClass };
