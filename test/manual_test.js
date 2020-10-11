"use strict";
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
	u: undefined,
	class: class a {}
};

myObj.c = myObj;
myObj.oo.o.c = myObj.o;
myObj.o.c = myObj.oo.o;
myObj.m.set(myObj.m, myObj);
myObj.se.add(myObj.m);
myObj.se.add(myObj.se);
myObj.inheritClass = class b extends myObj.class {
	constructor() {
		super();
	}
};

// sym = Symbol("test");
// myObj = sym;
// myObj = { [sym]: sym };
// myObj = new String("1");
// myObj.x = new String("2");
// myObj.y = new String("5");
// Object.defineProperty(myObj, "f", { value: new String("3"), enumerable: true });
// myObj.a = new String("4");

// myObj = [1, 2, 3, [4, 5]];
// myObj[4] = myObj;
// myObj.length = 10;
// myObj[11] = myObj[3];
// myObj.x = 30;
// myObj = {x:1,y:2,z:3,o:{x:1,y:2},oo:{y:4}};
// myObj.cc  = myObj;
// myObj.oo.c = myObj.o;

// sym = Symbol("test");
// myObj = Object(sym);
// myObj.s = sym;
// myObj.s2 = Symbol("test2");
// myObj = { sym: myObj, sym2: myObj.s2 };

// myObj = [1, 2, 3];
// myObj.x = 1;
// myObj[4] = 2;
// myObj["6"] = 1;
// sym = Symbol("test");
// myObj.a = [sym, myObj, 3, 4];
// myObj.a.b = { x: 1, [sym]: sym };
// myObj.length = 20;

// myObj = Object(BigInt(10));
// myObj[true] = "4";
// myObj.x = 1;
// myObj.c = myObj;
// class c {}

// c.f = c;

// class b extends c {
// 	constructor() {
// 		super();
// 	}
// }

// b = function() {};

// b.prototype.z = 1;

// class a extends b {
// 	constructor() {
// 		super();
// 	}
// }
// myObj = c;

// o = {c:class a extends b{}}
// o.x = class b extends o.c {};
// myObj = o;

// f= function(){};
// o={};
// myObj = f.bind(o);

// let buffer = new SharedArrayBuffer(10);
// let ui = new Uint8Array(buffer);
// ui[0] = 100;
// ui[8] = 234;
// ui[3] = 21;
// // myObj = new DataView(buffer);
// myObj = ui;

// myObj.cc = myObj;

// myObj = [new Uint8Array(buffer,3,4),new Int8Array(buffer),new ArrayBuffer(20)];

// myObj = { num: 1, str: "string", date: new Date(), re: /any regex/g };
// myObj.circular = myObj;
// myObj.repeated = myObj.date;

// myObj = {
// 	func: function f() {},
// 	sym: Symbol("1"),
// 	arr: new ArrayBuffer(4),
// 	circular: new Set()
// };

// myObj.func.prototype.sym = myObj.sym;
// myObj.circular.add(myObj);
// myObj.circular.add(myObj.sym);
// myObj.circular.add(myObj.func);
// myObj.circular.add(myObj.arr);
// myObj.circular.add(myObj.circular);

// let int16 = new Int16Array(myObj.arr);
// int16[0] = 1000;

// myObj = {};
// let current_obj = myObj;
// for(let i=0;i<2000;++i){
// 	current_obj.obj = {};
// 	current_obj = current_obj.obj;
// }
myObj = Symbol.replace;

var script = json_scriptify(myObj);

console.log("script :");
console.log(script);

var obj2 = eval(script);
console.log(obj2);
console.log(myObj);

console.log("checkSimilarity = ", checkSimilarity(myObj, obj2));
