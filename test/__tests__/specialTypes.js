/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../object_similarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("NaN", function() {
	expect(checkFor(NaN)).toEqual(true);
	expect(checkFor({ n: NaN, u: undefined, num: 1 })).toEqual(true);
});

test("undefined", function() {
	expect(checkFor(undefined)).toEqual(true);
	expect(checkFor({ n: NaN, u: undefined, num: 1 })).toEqual(true);
});

test("null", function() {
	expect(checkFor(null)).toEqual(true);
	expect(checkFor({ n: null, u: undefined, na: NaN, o: {} })).toEqual(true);
});

test("Infinity", function() {
	expect(checkFor(Infinity)).toEqual(true);
	expect(checkFor(-Infinity)).toEqual(true);
	expect(
		checkFor({
			n: null,
			u: undefined,
			na: NaN,
			Inf: Infinity,
			mInf: -Infinity,
			num: 1 / 0
		})
	).toEqual(true);
});
