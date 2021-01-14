/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("BigInt object with properties", function() {
	var obj = Object(BigInt(10));
	obj[true] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ BI: obj })).toEqual(true);
});
