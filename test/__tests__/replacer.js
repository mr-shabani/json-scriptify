/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../object_similarity");

// var run = function(obj) {
// 	return eval(scriptify(obj));
// };

// var checkFor = function(obj) {
// 	return checkSimilarity(obj, run(obj));
// };

test("Replacer", function() {
    let obj = { str: "String", o: { sym: Symbol(), n: 10 } };
    let replacer = function(x){
        if(typeof x == "symbol")
            return;
        return x;
    }
    let obj2 = { str: "String", o: { sym: undefined, n: 10 } };
	expect(checkSimilarity(eval(scriptify(obj,replacer)),obj2)).toEqual(true);
});

test("Replacer: filter symbol in key", function() {
    let sym = Symbol();
    let obj = { str: "String", o: { [sym]: Symbol(), n: 10 } };
    let replacer = function(x){
        if(typeof x == "symbol")
            return;
        return x;
    }
    let obj2 = { str: "String", o: { "undefined": undefined, n: 10 } };
	expect(checkSimilarity(eval(scriptify(obj,replacer)),obj2)).toEqual(true);
});
