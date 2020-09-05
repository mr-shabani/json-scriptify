var json_scriptify = require("../");
var checkSimilarity = require("./object_similarity");

var obj = {
	x: 1,
	s: new String("str"),
	f: function() {},
	o: {
		x: 2,
		y: 3
	},
	oo: {
		o: {
			x: 4
		}
	},
	d: new Date(),
	r: /regexp/g,
	a: [1, 2, 3],
	b: BigInt("1000000000000"),
	m: new Map([
		[new Map([[1, 2]]), new Map([[3, 4]])],
		["key1", 1],
		["key2", BigInt(2)],
		["key3", /3/],
		[BigInt(2), "key2"]
	]),
	se: new Set([1, "text", BigInt("100000000000"), new Set()]),
	n: NaN,
	nu: null,
	inf: Infinity,
	u: undefined
};

obj.c = obj;
obj.oo.o.c = obj.o;
obj.o.c = obj.oo.o;
obj.m.set(obj.m, obj);
obj.se.add(obj.m);
obj.se.add(obj.se);

obj = {
	m: new Map([
		[2, 3],
		[4, 5]
	]),
	m2: new Map()
};
obj.m.set(obj, obj.m2);
var f = function() {
	return 1;
};
f.x =1;
f.f = f;
obj.m.set(f, f);
obj.cm = obj.m;

var script = json_scriptify(obj);
// var script = json_scriptify.withAllFunctions(obj);

console.log(script);

var obj2 = eval(script);
console.log(obj2);
console.log(obj);

console.log("checkSimilarity = ", checkSimilarity(obj, obj2));
