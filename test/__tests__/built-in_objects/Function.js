/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../object_similarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("function with properties", function() {
	var obj = function() {};
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	obj = function f() {};
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	obj = function() {};
	let sym = Symbol();
	obj[sym] = function x() {};
	obj[sym]["a"] = 1;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});
test("arrow function with properties", function() {
	obj = () => 1;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("Generator function", function() {
	var obj = function*() {
		yield 1;
	};
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});
