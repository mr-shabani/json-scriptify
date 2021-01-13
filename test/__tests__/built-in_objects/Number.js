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

test("Number object with properties", function() {
	var obj = new Number(123);
	obj[4] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ n: obj })).toEqual(true);
});
