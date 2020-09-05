var scriptify = require("../../");
var checkSimilarity = require("../object_similarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("JSON object with circular references", function() {
	var obj = {};
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	obj.o = { x: 1, f: () => 1, obj: obj };
	expect(checkFor(obj, true)).toEqual(true);
	obj.oo = { y: 2, c: obj.o };
	obj.o.c = obj.oo;
	expect(checkFor(obj, true)).toEqual(true);
});

test("circular reference to built-in objects", function() {
	var obj = {};
	obj.m = new Map([[2,3]]);
	obj.m.set(obj,obj.m);
	obj.cm = obj.m;
	expect(checkFor(obj)).toEqual(true);
});

test("circular reference to functions", function() {
	var obj = {f:()=>1};
	obj.m = new Map([[obj.f,obj.f]]);
	obj.g =obj.f;
	expect(checkFor(obj)).toEqual(true);
});