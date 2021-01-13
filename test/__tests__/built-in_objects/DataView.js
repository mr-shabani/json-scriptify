/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("DataView object", function() {
	var buff = Uint8Array.from([1,2,3,4,5]).buffer;
	expect(checkFor(buff)).toEqual(true);
    expect(checkFor({ a: buff })).toEqual(true);
    var obj = new DataView(buff);
	expect(checkFor(obj)).toEqual(true);
    expect(checkFor({ a: obj })).toEqual(true);
    obj.setInt16(0,-1000,true);
	expect(checkFor(obj)).toEqual(true);
    expect(checkFor({ a: obj })).toEqual(true);
});
