var scriptify = require("../../../");
var checkSimilarity = require("../../object_similarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("Error object", function() {
	var obj = new Error("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("TypeError object", function() {
	var obj = new TypeError("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("URIError object", function() {
	var obj = new URIError("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("SyntaxError object", function() {
	var obj = new SyntaxError("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("ReferenceError object", function() {
	var obj = new ReferenceError("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("RangeError object", function() {
	var obj = new RangeError("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("EvalError object", function() {
	var obj = new EvalError("this error is for test only.");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});
