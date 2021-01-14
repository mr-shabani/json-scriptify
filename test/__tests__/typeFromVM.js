/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../checkSimilarity");
const vm = require("vm");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("Array object class", function() {
	var obj = vm.runInNewContext("[1, 2, 3, [4, 5, 6, [7, 8, 9]]]");
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

test("ArrayBuffer object", function() {
	const c = vm.createContext({});
	vm.runInContext("var obj = new ArrayBuffer(10)", c);
	var obj = vm.runInContext("obj", c);
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	let u = vm.runInContext("new Uint8Array(obj)", c);
	u[3] = 89;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("BigInt object with properties", function() {
	var obj = vm.runInNewContext("Object(BigInt(10))");
	obj[true] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ BI: obj })).toEqual(true);
});

test("Boolean object with properties", function() {
	var obj = vm.runInNewContext("new Boolean()");
	obj[true] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ b: obj })).toEqual(true);
});

test("Simple class", function() {
	var obj = vm.runInNewContext(`obj = class a {
		constructor() {}
	}`);
	obj.prototype.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("DataView object", function() {
	const c = vm.createContext({});
	var buff = vm.runInContext(
		"buff = Uint8Array.from([1, 2, 3, 4, 5]).buffer",
		c
	);
	expect(checkFor(buff)).toEqual(true);
	expect(checkFor({ a: buff })).toEqual(true);
	var obj = vm.runInContext("new DataView(buff)", c);
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.setInt16(0, -1000, true);
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("Date class", function() {
	expect(checkFor(vm.runInNewContext("new Date()"))).toEqual(true);
	expect(checkFor({ d: vm.runInNewContext("new Date(12345678)") })).toEqual(
		true
	);
});

test("SyntaxError object", function() {
	var obj = vm.runInNewContext(
		'new SyntaxError("this error is for test only.")'
	);
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("function with properties", function() {
	var obj = vm.runInNewContext("() => 1");
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("Map class", function() {
	expect(checkFor(vm.runInNewContext("new Map([[1, 2],[3, 4]])"))).toEqual(
		true
	);
	expect(checkFor(vm.runInNewContext("({m: new Map([[1,2],[3,4]])})"))).toEqual(
		true
	);
});

test("Number object with properties", function() {
	var obj = vm.runInNewContext("new Number(123)");
	obj[4] = "4";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ n: obj })).toEqual(true);
});

test("RegExp class", function() {
	expect(checkFor(vm.runInNewContext("/abc/"))).toEqual(true);
	expect(checkFor(vm.runInNewContext("{ r: /abc/gi }"))).toEqual(true);
	expect(checkFor(vm.runInNewContext('new RegExp("abc", "i")'))).toEqual(true);
	expect(
		checkFor(vm.runInNewContext('({ r: new RegExp("abc", "i")})'))
	).toEqual(true);
});

test("Set class", function() {
	expect(checkFor(vm.runInNewContext("new Set([1, 2, 3, 4])"))).toEqual(true);
	expect(checkFor(vm.runInNewContext("({ s: new Set([1, 2, 3, 4])})"))).toEqual(
		true
	);
});

test("SharedArrayBuffer object", function() {
	var obj = vm.runInNewContext("new SharedArrayBuffer(10)");
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	let u = new Uint8Array(obj);
	u[3] = 89;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});

test("String object with properties", function() {
	var obj = vm.runInNewContext('new String("0123")');
	obj[4] = "4";
	obj[BigInt(2)] = "5";
	obj.x = 1;
	obj.c = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ s: obj })).toEqual(true);
});

test("Symbol type", function() {
	var obj = vm.runInNewContext('Symbol("test")');
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ sym: obj, sym2: obj })).toEqual(true);
});

test("Uint8Array object", function() {
	var obj = vm.runInNewContext("new Uint8Array([1,2,3,4,5])");
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj[10] = 89;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
	obj.x = 2;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ a: obj })).toEqual(true);
});
