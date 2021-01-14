/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("Uint8Array object", function() {
	var obj = new Uint8Array([1,2,3,4,5]);
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[10] = 89;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("Uint8Array object with byteOffset", function() {
	var buff = Uint8Array.from([0,1,2,3,4,5,7,8,9]).buffer;
	expect(checkFor(buff)).toEqual(true);
	expect(checkFor({ a: buff })).toEqual(true);
    var obj = new Uint8Array(buff,3,4);
    expect(obj.buffer).toEqual(buff);

	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[4]=10;
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("Uint32Array object with byteOffset", function() {
	var buff = Uint32Array.from([0,1,2,3,4,5,7,8,9]).buffer;
	expect(checkFor(buff)).toEqual(true);
	expect(checkFor({ a: buff })).toEqual(true);
    var obj = new Uint32Array(buff,4,4);
    expect(obj.buffer).toEqual(buff);

	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[4]=10;
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});
