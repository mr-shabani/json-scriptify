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

test("function with properties", function() {
	var obj = () => 1;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("String object with properties", function() {
	var obj = new String("0123");
	obj[4] = "4";
	obj[2n] = "5";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ s: obj })).toEqual(true);
});

test("Number object with properties", function() {
	var obj = new Number(123);
	obj[4] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ n: obj })).toEqual(true);
});

test("Boolean object with properties", function() {
	var obj = new Boolean();
	obj[true] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ b: obj })).toEqual(true);
});

test("BigInt object with properties", function() {
	var obj = Object(BigInt(10));
	obj[true] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ BI: obj })).toEqual(true);
});

test("Symbol type", function() {
	var obj = Symbol("test");
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ sym: obj, sym2: obj })).toEqual(true);
});

test("Symbol object class", function() {
	var sym = Symbol("test");
	var obj = Object(sym);
	obj.s = sym;
	obj.s2 = Symbol("test2");
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ sym: obj, sym2: obj.s2 })).toEqual(true);
});

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
	obj[11]={x:1,y:2};
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.length = 20;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = [1,2,3];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[Symbol()]=[2,3];
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});
