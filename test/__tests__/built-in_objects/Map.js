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

test("Map class", function() {
	expect(
		checkFor(
			new Map([
				[1, 2],
				[3, 4]
			])
		)
	).toEqual(true);
	expect(
		checkFor({
			m: new Map([
				[1, 2],
				[3, 4]
			])
		})
	).toEqual(true);
});

test("Map class with circular", function() {
	let map = new Map([
		[1, 2],
		[3, 4]
	]);
	map.set(map, map);
	expect(checkFor(map)).toEqual(true);
	let obj = { map };
	map.set(obj, obj);
	expect(checkFor(obj)).toEqual(true);
});
