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

test("String object with properties", function() {
	var obj = new String("0123");
	obj[4] = "4";
	obj[2n] = "5";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ s: obj })).toEqual(true);
});
