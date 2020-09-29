var scriptify = require("../../../");
var checkSimilarity = require("../../object_similarity");

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
		constructor() {}
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
	var o = {c:class a {}}
	var obj = class b extends o.c {
		constructor() {}
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
			constructor() {}
		};
		obj.prototype.x = 1;
		obj.f = obj;
		return obj;
	};
	var obj2Constructor = function() {
		p = class a {};
		var obj2 = class b extends p {
			constructor() {}
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
