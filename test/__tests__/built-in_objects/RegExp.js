var scriptify = require("../../../");
var checkSimilarity = require("../../object_similarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("RegExp class", function() {
	expect(checkFor(/abc/)).toEqual(true);
	expect(checkFor({ r: /abc/gi })).toEqual(true);
	expect(checkFor(new RegExp("abc", "i"))).toEqual(true);
	expect(checkFor({ r: new RegExp("abc", "i") })).toEqual(true);
});
