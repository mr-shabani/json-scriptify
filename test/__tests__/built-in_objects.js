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

test("Date class", function() {
	expect(checkFor(new Date())).toEqual(true);
	expect(checkFor({ d: new Date(12345678) })).toEqual(true);
});

test("RegExp class", function() {
	expect(checkFor(/abc/)).toEqual(true);
	expect(checkFor({ r: /abc/gi })).toEqual(true);
	expect(checkFor(new RegExp("abc", "i"))).toEqual(true);
	expect(checkFor({ r: new RegExp("abc", "i") })).toEqual(true);
});

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

test("Set class", function() {
	expect(checkFor(new Set([1, 2, 3, 4]))).toEqual(true);
	expect(checkFor({ s: new Set([1, 2, 3, 4]) })).toEqual(true);
});

test("Set class with circular", function() {
	let set = new Set([
		[1, 2],
		[3, 4]
	]);
	set.add(set);
	expect(checkFor(set)).toEqual(true);
	let obj = { set };
	set.add(obj);
	expect(checkFor(obj)).toEqual(true);
});
