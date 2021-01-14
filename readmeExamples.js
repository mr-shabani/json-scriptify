"use strict";
const scriptify = require('./');
let obj;
let script;
const withColor = '\x1b[30;42m%s\x1b[0m';

// Example 1:
console.log(withColor, "Example 1 :");

obj = { num: 1, str: "string", date: new Date(), re: /any regex/g };
script = scriptify(obj);

console.log(script);

obj.circular = obj;
obj.repeated = obj.date;

script = scriptify(obj);

console.log(script);

// Example 2:
console.log(withColor, "Example 2 :");

obj = {
	func: function() {},
	sym: Symbol("1"),
	arr: new ArrayBuffer(4),
	circular: new Set()
};

obj.func.prototype.sym = obj.sym;
obj.circular.add(obj);
obj.circular.add(obj.sym);
obj.circular.add(obj.func);
obj.circular.add(obj.arr);
obj.circular.add(obj.circular);

let int16 = new Int16Array(obj.arr);
int16[0] = 1000;

script = scriptify(obj);

console.log(script);

// Example 3:
console.log(withColor, "Example 3 :");

obj = { num: 1, str: "string", date: new Date(), re: /any regex/g };

let replacer = function(value) {
	if (typeof value == "object" && value!==obj) return;
	return value;
};

script = scriptify(obj,replacer);

console.log(script);

// Example 4:
console.log(withColor, "Example 4 :");

let parentClass = class a {};
obj = class myExtendedClass extends parentClass {};

script = scriptify(obj,null, { predefined: [["parentClass", parentClass]] });

console.log(script);