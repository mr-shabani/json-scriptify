var scriptify = require("../../../");
var checkSimilarity = require("../../object_similarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("Uint8Array object", function() {
	var obj = new Uint8Array([1,2,3,4,5]).buffer;
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
	var obj = new Uint8Array([0,1,2,3,4,5,7,8,9]).buffer;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
    var obj2 = new Uint8Array(obj,3,4);
    expect(obj2.buffer).toEqual(obj);

	expect(checkFor(obj2)).toEqual(true);
	expect(checkFor({ a: obj2 })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj2)).toEqual(true);
	expect(checkFor({ a: obj2 })).toEqual(true);
});

test("Uint32Array object with byteOffset", function() {
	var obj = new Uint32Array([0,1,2,3,4,5,7,8,9]).buffer;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
    var obj2 = new Uint32Array(obj,4,4);
    expect(obj2.buffer).toEqual(obj);

	expect(checkFor(obj2)).toEqual(true);
	expect(checkFor({ a: obj2 })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj2)).toEqual(true);
	expect(checkFor({ a: obj2 })).toEqual(true);
});
