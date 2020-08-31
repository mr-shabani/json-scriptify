var scriptify = require("../../");
var checkSimilarity = require("../object_similarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("JSON object with circular references", function() {
	var obj = {};
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	obj.o = { x: 1, f: () => 1, obj: obj };
	expect(checkFor(obj, true)).toEqual(true);
	obj.oo = { y: 2, c: obj.o };
	obj.o.c = obj.oo;
	expect(checkFor(obj, true)).toEqual(true);
});

