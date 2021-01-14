/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../checkSimilarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("Array properties", function() {
	var obj = [1, 2, 3];
	obj.x = 1;
	expect(checkFor(obj)).toEqual(true);
    expect(checkFor({ a: obj })).toEqual(true);
    obj[4]=2;
	expect(checkFor(obj)).toEqual(true);
    expect(checkFor({ a: obj })).toEqual(true);
    obj['6']=1;
	expect(checkFor(obj)).toEqual(true);
    expect(checkFor({ a: obj })).toEqual(true);
	let sym = Symbol("test");
	obj[sym] = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.a = [sym, obj, 3, 4];
	obj.a.b = { x: 1, [sym]: sym };
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.length = 20;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("function properties", function() {
	var f = function(a, b = 10, ...rest) {};
	var obj = f;
	obj.x = 1;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	let sym = Symbol("test");
	obj[sym] = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.a = [sym, obj, 3, 4];
	obj.a.b = { x: 1, [sym]: sym };
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.a.c = function(a, b = obj.a.b, ...rest) {};
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("String properties", function() {
	var s = new String('str1');
	var obj = s;
	obj.x = 1;
	obj.s = new String('str2');
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	let sym = Symbol("test");
	obj[sym] = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.a = new String('str3');
	obj.a.b = { x: 1, [sym]: obj.s };
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});