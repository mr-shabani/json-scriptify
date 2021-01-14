var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("Array object class", function() {
	var obj = [1, 2, 3, [4, 5, 6, [7, 8, 9]]];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[10] = ["a", "b", ["c", "d"]];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[10][2][10] = obj[3][3][0];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[11] = { x: 1, y: 2 };
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.length = 20;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = [1, 2, 3];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[Symbol()] = [2, 3];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});
