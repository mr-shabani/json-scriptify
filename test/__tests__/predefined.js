/* eslint-disable no-undef */
var scriptify = require("../../src");
var checkSimilarity = require("../object_similarity");

// var run = function(obj) {
// 	return eval(scriptify(obj));
// };

// var checkFor = function(obj) {
// 	return checkSimilarity(obj, run(obj));
// };

test("predefined values", function() {
	let obj = { str: String, [Symbol.iterator]: Number };
	expect("({str:String,[Symbol.iterator]:Number})").toEqual(scriptify(obj));
});

test("predefined objects", function() {
	let sym = Symbol();
	let obj = { str: "String", o: { [sym]: Symbol(), n: 10 } };
	let obj2 = { str: "String", o: { undefined: Symbol(), n: 10 } };
	expect(
		checkSimilarity(
			eval(scriptify(obj, null, { predefined: [["undefined", sym]] })),
			obj2
		)
	).toEqual(true);
	expect(() =>
		scriptify(obj, null, { predefined: ["script", obj] })
	).toThrowError();
	expect(() =>
		scriptify(obj, null, { predefined: [[obj, "script"]] })
	).toThrowError();
	expect(() =>
		scriptify(obj, null, {
			predefined: [["script", obj, "excessive elements"]]
		})
	).toThrowError();
});
