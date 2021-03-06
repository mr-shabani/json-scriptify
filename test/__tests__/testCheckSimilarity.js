/* eslint-disable no-undef */
var checkSimilarity = require("../checkSimilarity");

test("not object check", function() {
	expect(checkSimilarity(1, 1)).toEqual(true);
	expect(checkSimilarity(1, 2)).toEqual(false);
	expect(checkSimilarity("str", "str")).toEqual(true);
	expect(checkSimilarity("str", "lkj")).toEqual(false);
	expect(
		checkSimilarity(
			() => 1,
			() => 1
		)
	).toEqual(true);
	expect(
		checkSimilarity(
			() => 1,
			function() {
				return 1;
			}
		)
	).toEqual(false);
	expect(checkSimilarity(true, true)).toEqual(true);
	expect(checkSimilarity(true, false)).toEqual(false);
});

test("simple object", function() {
	expect(checkSimilarity({}, {})).toEqual(true);
	expect(checkSimilarity({ x: 1 }, { x: 1 })).toEqual(true);
	expect(checkSimilarity({ x: 1, y: 2 }, { x: 1 })).toEqual(false);
	expect(checkSimilarity({ x: 1 }, { x: 1, y: 2 })).toEqual(false);
	expect(checkSimilarity({ x: [1, 2] }, { x: [1, 2] })).toEqual(true);
});

test("object with defined properties", function() {
	let obj1 = {};
	Object.defineProperty(obj1, "a", { value: 1, configurable: true });
	let obj2 = {};
	Object.defineProperty(obj2, "a", {
		value: 1,
		configurable: true,
		writable: true
	});
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	Object.defineProperty(obj2, "a", {
		value: 1,
		configurable: true,
		writable: false
	});
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
	Object.defineProperty(obj1, "b", {
		get() {
			return 1;
		},
		configurable: true
	});
	Object.defineProperty(obj2, "b", { value: 1, configurable: true });
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	Object.defineProperty(obj2, "b", {
		get() {
			return 1;
		},
		configurable: true
	});
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
	Object.defineProperty(obj2, "b", {
		get: function() {
			return 1;
		},
		configurable: true
	});
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
});

test("object with circular reference", function() {
	let obj1 = {};
	obj1.c = obj1;
	let obj2 = {};
	obj2.c = obj1;
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2.c = obj2;
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("object with regex", function() {
	let obj1 = { r: /abc/g };
	obj1.c = obj1;
	let obj2 = {};
	obj2.c = obj2;
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2.r = /abc/g;
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("object with map", function() {
	let obj1 = {
		m: new Map([
			[1, 2],
			["s", "t"]
		])
	};
	obj1.c = obj1;
	let obj2 = {
		m: new Map([
			[1, 2],
			["s", "t"]
		])
	};
	obj2.c = obj2;
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("object with circular map", function() {
	let obj1 = {
		m: new Map([
			[1, 2],
			["s", "t"]
		])
	};
	obj1.c = obj1;
	obj1.m.set(obj1, obj1);
	obj1.m.set(obj1.m, obj1);
	obj1.m.set(obj1, obj1.m);
	obj1.m.set(obj1.m, obj1.m);
	let obj2 = {
		m: new Map([
			[1, 2],
			["s", "t"]
		])
	};
	obj2.c = obj2;
	obj2.m.set(obj2, obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2.m.set(obj2.m, obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2.m.set(obj2, obj2.m);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2.m.set(obj2.m, obj2.m);
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("object with set", function() {
	let obj1 = { s: new Set([1, Symbol("2"), "t"]) };
	obj1.c = obj1;
	let obj2 = { s: new Set([1, Symbol("2")]) };
	obj2.s.add("t");
	obj2.c = obj2;
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("object with circular set", function() {
	let obj1 = { s: new Set([1, 2, "t"]) };
	obj1.c = obj1;
	obj1.s.add(obj1);
	obj1.s.add(obj1.s);
	let obj2 = { s: new Set([2, "t"]) };
	obj2.s.add(1);
	obj2.c = obj2;
	obj2.s.add(obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2.s.add(obj2.s);
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("NaN null undefined Infinity", function() {
	let obj1 = NaN;
	expect(checkSimilarity(NaN, obj1)).toEqual(true);
	expect(checkSimilarity(null, obj1)).toEqual(false);
	expect(checkSimilarity(undefined, obj1)).toEqual(false);
	expect(checkSimilarity(Infinity, obj1)).toEqual(false);
	expect(checkSimilarity("", obj1)).toEqual(false);
	expect(checkSimilarity(false, obj1)).toEqual(false);
	obj1 = undefined;
	expect(checkSimilarity(NaN, obj1)).toEqual(false);
	expect(checkSimilarity(null, obj1)).toEqual(false);
	expect(checkSimilarity(undefined, obj1)).toEqual(true);
	expect(checkSimilarity(Infinity, obj1)).toEqual(false);
	expect(checkSimilarity("", obj1)).toEqual(false);
	expect(checkSimilarity(false, obj1)).toEqual(false);
	obj1 = null;
	expect(checkSimilarity(NaN, obj1)).toEqual(false);
	expect(checkSimilarity(null, obj1)).toEqual(true);
	expect(checkSimilarity(undefined, obj1)).toEqual(false);
	expect(checkSimilarity(Infinity, obj1)).toEqual(false);
	expect(checkSimilarity("", obj1)).toEqual(false);
	expect(checkSimilarity(false, obj1)).toEqual(false);
	obj1 = Infinity;
	expect(checkSimilarity(NaN, obj1)).toEqual(false);
	expect(checkSimilarity(null, obj1)).toEqual(false);
	expect(checkSimilarity(undefined, obj1)).toEqual(false);
	expect(checkSimilarity(Infinity, obj1)).toEqual(true);
	expect(checkSimilarity(-Infinity, obj1)).toEqual(false);
	expect(checkSimilarity(-Infinity, -Infinity)).toEqual(true);
	expect(checkSimilarity("", obj1)).toEqual(false);
	expect(checkSimilarity(false, obj1)).toEqual(false);
});

test("Number classes", function() {
	let obj1 = new Number(1);
	let obj2 = new Number(1);
	expect(checkSimilarity(1, obj1)).toEqual(false);
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	obj1.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(false);
	obj2.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
});

test("String classes", function() {
	let obj1 = new String("str");
	let obj2 = new String("str");
	expect(checkSimilarity("str", obj1)).toEqual(false);
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	obj1.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(false);
	obj2.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
});

test("Boolean classes", function() {
	let obj1 = new Boolean(false);
	let obj2 = new Boolean(false);
	expect(checkSimilarity(false, obj1)).toEqual(false);
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	obj1.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(false);
	obj2.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	obj1 = new Boolean(true);
	obj2 = new Boolean(true);
	expect(checkSimilarity(true, obj1)).toEqual(false);
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	obj1.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(false);
	obj2.x = 1;
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
});

test("ArrayBuffer class", function() {
	let obj1 = new ArrayBuffer(10);
	let u1 = new Uint8Array(obj1);
	let obj2 = new ArrayBuffer(4);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2 = new ArrayBuffer(10);
	let u2 = new Uint8Array(obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	u1[2] = 20;
	expect(checkSimilarity(obj2, obj1)).toEqual(false);
	u2[2] = 20;
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
});

test("TypedArray classes", function() {
	let obj1 = new ArrayBuffer(10);
	let u1 = new Uint8Array(obj1);
	let obj2 = new ArrayBuffer(4);
	let u2 = new Uint8Array(obj2);
	expect(checkSimilarity(u1, u2)).toEqual(false);
	obj2 = new ArrayBuffer(10);
	u2 = new Uint8Array(obj2);
	expect(checkSimilarity(u1, u2)).toEqual(true);
	expect(checkSimilarity(u2, u1)).toEqual(true);
	u1[2] = 20;
	expect(checkSimilarity(u1, u2)).toEqual(false);
	u2[2] = 20;
	expect(checkSimilarity(u1, u2)).toEqual(true);
	u1 = new Uint8Array(obj1, 2, 4);
	expect(checkSimilarity(u1, u2)).toEqual(false);
	u2 = new Uint8Array(obj2, 2, 3);
	expect(checkSimilarity(u1, u2)).toEqual(false);
	u2 = new Uint8Array(obj2, 2, 4);
	expect(checkSimilarity(u1, u2)).toEqual(true);
});

test("SharedArrayBuffer class", function() {
	let obj1 = new SharedArrayBuffer(10);
	let u1 = new Uint8Array(obj1);
	let obj2 = new SharedArrayBuffer(4);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
	obj2 = new SharedArrayBuffer(10);
	let u2 = new Uint8Array(obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
	u1[2] = 20;
	expect(checkSimilarity(obj2, obj1)).toEqual(false);
	u2[2] = 20;
	expect(checkSimilarity(obj2, obj1)).toEqual(true);
});
