var scriptify = require("../../");
var checkSimilarity = require("../object_similarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
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

test("pain JSON object with functions", function() {
	expect(checkFor(function() {}, true)).toEqual(true);
	expect(checkFor(() => 1, true)).toEqual(true);
	expect(checkFor({ f: function() {} }, true)).toEqual(true);
	expect(checkFor({ x: 1, f: () => 1 }, true)).toEqual(true);
});

test("simple plain JSON object with special character in keys", function() {
	expect(checkFor({ "#": 1 })).toEqual(true);
	expect(checkFor({ "\n": 1 })).toEqual(true);
	expect(checkFor({ '"': 1 })).toEqual(true);
	expect(checkFor({ "'": 1 })).toEqual(true);
	expect(checkFor({ '1': 1 })).toEqual(true);
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
});

test("JSON object with circular references", function() {
	var obj = {};
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	obj.o = { x: 1, f: () => 1, obj: obj };
	expect(checkFor(obj,true)).toEqual(true);
	obj.oo = { y: 2, c: obj.o };
	obj.o.c = obj.oo;
	expect(checkFor(obj,true)).toEqual(true);
});
