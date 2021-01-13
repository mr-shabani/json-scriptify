/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../checkSimilarity");

var run = function(obj) {
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("Simple class", function() {
	var obj = class a {
		constructor() {}
	};
	obj.prototype.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("class with inheritance", function() {
	class a {}
	var obj = class b extends a {
		constructor() {
			super();
		}
	};
	obj.prototype.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	var f = function() {};
	f.prototype.z = 1;
	obj = class c extends f {};
	obj.prototype.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("class with predefined parent class", function() {
	let obj = class myExtendedClass extends String {};
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ c: obj })).toEqual(true);
	let str = String;
	obj = class myExtendedClass extends str {};
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ c: obj })).toEqual(true);
	let parentClass = class a {};
	obj = {
		a: parentClass
	};
	obj.b = class myExtendedClass extends obj.a {};
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ c: obj })).toEqual(true);
});

test("class with multi inheritance", function() {
	class a {}
	class b extends a {
		constructor() {
			super();
		}
	}
	var obj = class c extends b {
		constructor() {
			super();
		}
	};
	obj.prototype.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("class with membership in inheritance name", function() {
	var o = { c: class a {} };
	var obj = class b extends o.c {
		constructor() {
			super();
		}
	};
	obj.prototype.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("class with complex name for inheritance", function() {
	var objConstructor = function() {
		o = { getClass: () => class a {} };
		var obj = class b extends o.getClass() {
			constructor() {
				super();
			}
		};
		obj.prototype.x = 1;
		obj.f = obj;
		return obj;
	};
	var obj2Constructor = function() {
		p = class a {};
		var obj2 = class b extends p {
			constructor() {
				super();
			}
		};
		obj2.prototype.x = 1;
		obj2.f = obj2;
		return obj2;
	};
	expect(checkSimilarity(run(objConstructor()), obj2Constructor())).toEqual(
		true
	);
	expect(
		checkSimilarity(run({ f: objConstructor() }), { f: obj2Constructor() })
	).toEqual(true);
});

test("arrow function that starts with class identifier", function() {
	var obj = class_ => 1;
	obj.x=1;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});
