var checkSimilarity = require("../object_similarity");

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
	expect(checkSimilarity({ x: 1 }, { x: 1, y: 2 })).toEqual(true);
	expect(checkSimilarity({ x: [1, 2] }, { x: [1, 2] })).toEqual(true);
});

test("object with circular reference", function() {
	let obj1 = {};
	obj1.c = obj1;
	let obj2 = {};
	obj2.c = obj2;
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});

test("object with regex", function() {
	let obj1 = {r:/abc/g};
	obj1.c = obj1;
	let obj2 = {};
	obj2.c = obj2;
    expect(checkSimilarity(obj1, obj2)).toEqual(false);
    obj2.r = /abc/g;
    expect(checkSimilarity(obj1, obj2)).toEqual(true);
});


test("object with map", function() {
	let obj1 = {m:new Map([[1,2],["s","t"]])};
	obj1.c = obj1;
	let obj2 = {m:new Map([[1,2],["s","t"]])};
	obj2.c = obj2;
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});


test("object with circular map", function() {
	let obj1 = {m:new Map([[1,2],["s","t"]])};
    obj1.c = obj1;
    obj1.m.set(obj1,obj1);
    obj1.m.set(obj1.m,obj1);
    obj1.m.set(obj1,obj1.m);
    obj1.m.set(obj1.m,obj1.m);
	let obj2 = {m:new Map([[1,2],["s","t"]])};
	obj2.c = obj2;
    obj2.m.set(obj2,obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
    obj2.m.set(obj2.m,obj2);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
    obj2.m.set(obj2,obj2.m);
	expect(checkSimilarity(obj1, obj2)).toEqual(false);
    obj2.m.set(obj2.m,obj2.m);
	expect(checkSimilarity(obj1, obj2)).toEqual(true);
});
