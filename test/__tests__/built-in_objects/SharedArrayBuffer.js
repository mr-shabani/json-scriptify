/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("SharedArrayBuffer object", function() {
	var obj = new SharedArrayBuffer(10);
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	let u = new Uint8Array(obj);
	u[3] = 89;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("Uint8Array object with byteOffset", function() {
	var buff = new SharedArrayBuffer(10);
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
