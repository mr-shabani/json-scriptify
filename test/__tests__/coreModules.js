/* eslint-disable no-undef */
var scriptify = require("../../");
var checkSimilarity = require("../checkSimilarity");

var run = function(obj) {
	"use strict";
	return eval(scriptify(obj));
};

var checkFor = function(obj) {
	return checkSimilarity(obj, run(obj));
};

test("check for http module", function() {
	expect(checkFor(require("http"))).toEqual(true);
});

test("check for fs module", function() {
	expect(checkFor(require("fs"))).toEqual(true);
});

test("check for net module", function() {
	expect(checkFor(require("net"))).toEqual(true);
});

test("check for zlib module", function() {
	expect(checkFor(require("zlib"))).toEqual(true);
});
