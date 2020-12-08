/* eslint-disable no-undef */
var scriptify = require("../../../");
var checkSimilarity = require("../../object_similarity");

var run = function(obj, withFunctions) {
	if (withFunctions) return eval(scriptify.withAllFunctions(obj));
	return eval(scriptify(obj));
};

var checkFor = function(obj, withFunctions) {
	if (withFunctions) return checkSimilarity(obj, run(obj, withFunctions));
	return checkSimilarity(obj, run(obj));
};

test("simple method", function() {
	var o = {
		func(x) {
			return x;
		}
	};
	expect(scriptify(o)).toBe("({func(x) {\n      return x;\n    }})");
	var obj = o.func;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	o = {
		function(x) {
			return x;
		}
	};
	obj = o.function;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	o = {
		func: function func(x) {
			return x;
		}
	};
	obj = o.func;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("getter method", function() {
	var o = {
		get func() {
			return 1;
		}
	};
	expect(scriptify(o)).toBe("({get func() {\n      return 1;\n    }})");
	var obj = Object.getOwnPropertyDescriptor(o, "func").get;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	obj = {};
	Object.defineProperty(obj, "prop", {
		get: Object.getOwnPropertyDescriptor(o, "func").get,
		configurable: true
	});
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("setter method", function() {
	var o = {
		set func(x) {}
	};
	expect(scriptify(o)).toBe("({set func(x) {}})");
	var obj = Object.getOwnPropertyDescriptor(o, "func").set;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	obj = {};
	Object.defineProperty(obj, "prop", {
		set: Object.getOwnPropertyDescriptor(o, "func").set,
		configurable: true
	});
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});

test("Generator methods", function() {
	var o = {
		*func(x) {
			yield x;
		}
	};
	expect(scriptify(o)).toBe("({*func(x) {\n      yield x;\n    }})");
	var obj = o.func;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	o = {
		*function(x) {
			yield x;
		}
	};
	obj = o.function;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
	o = {
		func: function* func(x) {
			yield x;
		}
	};
	obj = o.func;
	obj.x = 1;
	obj.f = obj;
	expect(checkFor(obj)).toEqual(true);
	expect(checkFor({ f: obj })).toEqual(true);
});
