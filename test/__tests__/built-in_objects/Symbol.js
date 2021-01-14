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

test("Symbol type", function() {
	var obj = Symbol("test");
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ sym: obj, sym2: obj })).toEqual(true);
});

test("Symbol object class", function() {
	var sym = Symbol("test");
	var obj = Object(sym);
	obj.s = sym;
	obj.s2 = Symbol("test2");
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ sym: obj, sym2: obj.s2 })).toEqual(true);
});
