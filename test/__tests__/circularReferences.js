/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../checkSimilarity");

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
	expect(checkFor(obj)).toEqual(true);
	obj.oo = { y: 2, c: obj.o };
	obj.o.c = obj.oo;
	expect(checkFor(obj)).toEqual(true);
});

test("Array with circular references", function() {
	var obj = [1,2,3];
	obj[3] = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({a:obj})).toEqual(true);
});

test("Map with circular reference", function() {
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