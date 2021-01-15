/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../checkSimilarity");

// var run = function(obj) {
// 	return eval(scriptify(obj));
// };

// var checkFor = function(obj) {
// 	return checkSimilarity(obj, run(obj));
// };

test("Replacer", function() {
	let obj = { str: "String", o: { sym: Symbol(), n: 10 } };
	let replacer = function(x) {
		if (typeof x == "symbol") return;
		return x;
	};
	let obj2 = { str: "String", o: { sym: undefined, n: 10 } };
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
});

test("Replacer: ignore props", function() {
	let obj = { str: "String", o: { sym: Symbol(), n: 10 } };
	let replacer = function(x) {
		if (typeof x == "symbol") return scriptify.ignore;
		return x;
	};
	let obj2 = { str: "String", o: { n: 10 } };
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
	obj = new Map([
		[Symbol(), 1],
		[2, 3]
	]);
	obj2 = new Map([
		[null, 1],
		[2, 3]
	]);
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
	obj[Symbol()] = obj;
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
	obj.n = Symbol();
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
});

test("Replacer: filter symbol in key", function() {
	let sym = Symbol();
	let obj = { str: "String", o: { [sym]: Symbol(), n: 10 } };
	let replacer = function(x) {
		if (typeof x == "symbol") return;
		return x;
	};
	let obj2 = { str: "String", o: { undefined: undefined, n: 10 } };
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
});

test("Replacer: ignore symbol in key", function() {
	let sym = Symbol();
	let obj = { str: "String", o: { [sym]: "props with symbolic key", n: 10 } };
	let replacer = function(x) {
		if (typeof x == "symbol") return scriptify.ignore;
		return x;
	};
	let obj2 = { str: "String", o: { n: 10 } };
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
});

test("Replacer: ignoreSomeProps", function() {
	let sym = Symbol();
	let obj = { str: "String", o: { [sym]: "props with symbolic key", n: 10 } };
	obj.map = new Map([[1,2]]);
	obj.map[sym]="this prop will be ignored";
	let replacer = function(x) {
		return scriptify.ignoreSomeProps(x,[sym]);
	};
	let obj2 = { str: "String", o: { n: 10 } };
	obj2.map = new Map([[1,2]]);
	expect(checkSimilarity(eval(scriptify(obj, replacer)), obj2)).toEqual(true);
});
