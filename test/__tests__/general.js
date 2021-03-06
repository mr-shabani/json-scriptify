/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../checkSimilarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("is not an object", function() {
	const num = 1,
		str = "string",
		bool = true;
	expect(run(num)).toEqual(num);
	expect(run(str)).toEqual(str);
	expect(run(bool)).toEqual(bool);
});

test("simple plain JSON object", function() {
	expect(checkFor({})).toEqual(true);
	expect(checkFor({ x: 1 })).toEqual(true);
	expect(checkFor({ str: "string" })).toEqual(true);
	expect(checkFor({ bool: true })).toEqual(true);
	expect(checkFor({ x: 1, y: 2 })).toEqual(true);
	expect(checkFor({ x: 1, obj: {} })).toEqual(true);
	expect(checkFor({ x: 1, obj: { y: 2 } })).toEqual(true);
});

test("plain JSON object with functions", function() {
	expect(checkFor(function() {})).toEqual(true);
	expect(checkFor(() => 1)).toEqual(true);
	expect(checkFor({ f: function() {} })).toEqual(true);
	expect(checkFor({ x: 1, f: () => 1 })).toEqual(true);
});

test("simple plain JSON object with special character in keys", function() {
	expect(checkFor({ "#": 1 })).toEqual(true);
	expect(checkFor({ "\n": 1 })).toEqual(true);
	expect(checkFor({ '"': 1 })).toEqual(true);
	expect(checkFor({ "'": 1 })).toEqual(true);
	expect(checkFor({ "1": 1 })).toEqual(true);
	let obj = {};
	obj["#"] = obj;
	expect(checkFor(obj)).toEqual(true);
	obj["\n"] = obj;
	expect(checkFor(obj)).toEqual(true);
	obj["'"] = obj;
	expect(checkFor(obj)).toEqual(true);
	obj["1"] = obj;
	expect(checkFor(obj)).toEqual(true);
	obj['"'] = obj;
	expect(checkFor(obj)).toEqual(true);
	obj[""] = obj;
	expect(checkFor(obj)).toEqual(true);
});

test("JSON object", function() {
	var obj = { x: 1, y: 2 };
	expect(checkFor(obj)).toEqual(true);
	obj.b = true;
	expect(checkFor(obj)).toEqual(true);
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	obj.o = { z: 3 };
	obj.oo = { a: 4, cc: obj.o };
	expect(checkFor(obj)).toEqual(true);
	Object.defineProperty(obj, "e", { value: 5, enumerable: true });
	expect(checkFor(obj)).toEqual(true);
	Object.defineProperty(obj, "q", { value: obj.oo, enumerable: true });
	expect(checkFor(obj)).toEqual(true);
	let sym = Symbol("test");
	obj[sym] = sym;
	expect(checkFor(obj)).toEqual(true);
});
