var json_scriptify = require("../");
var checkSimilarity = require("./object_similarity");

var myObj = {
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
		[new Map([[new Map([[1, 2]]), new Set([1, 2, 3])]]), new Map([[3, 4]])],
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

myObj.c = myObj;
myObj.oo.o.c = myObj.o;
myObj.o.c = myObj.oo.o;
myObj.m.set(myObj.m, myObj);
myObj.se.add(myObj.m);
myObj.se.add(myObj.se);

sym = Symbol("test");
myObj = sym;
myObj ={[sym]:sym}
// myObj = new String("1");
// myObj.x = new String("2");
// myObj.y = new String("5");
// Object.defineProperty(myObj, "f", { value: new String("3"), enumerable: true });
// myObj.a = new String("4");

// myObj = [1, 2, 3, [4, 5]];
// myObj[4]=myObj;
// myObj.length = 10;
// myObj[11] = myObj[3];
// myObj = {x:1,y:2,z:3,o:{x:1,y:2}};
// myObj.cc  = myObj;

var script = json_scriptify(myObj);
// var script = json_scriptify.withAllFunctions(obj);

console.log(script);

var obj2 = eval(script);
console.log(obj2);
console.log(myObj);

console.log("checkSimilarity = ", checkSimilarity(myObj, obj2));
