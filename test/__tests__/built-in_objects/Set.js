/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("Set class", function() {
	expect(checkFor(new Set([1, 2, 3, 4]))).toEqual(true);
	expect(checkFor({ s: new Set([1, 2, 3, 4]) })).toEqual(true);
});

test("Set class with circular", function() {
	let set = new Set([
		[1, 2],
		[3, 4]
	]);
	set.add(set);
	expect(checkFor(set)).toEqual(true);
	let obj = { set };
	set.add(obj);
	expect(checkFor(obj)).toEqual(true);
});
