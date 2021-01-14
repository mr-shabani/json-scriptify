"use strict";

const tokens = []; // list of tokens
// empty string for "end" means any single character
const scapeBackslashToken = { begin: "\\", end: "", innerTokens: [] };
tokens.push(
	{ begin: '"', end: '"', innerTokens: [scapeBackslashToken] },
	{ begin: "`", end: "`", innerTokens: [scapeBackslashToken] },
	{ begin: "'", end: "'", innerTokens: [scapeBackslashToken] },
	{ begin: "//", end: "\n", innerTokens: [] },
	{ begin: "/*", end: "*/", innerTokens: [] },
	{ begin: "(", end: ")", innerTokens: tokens },
	{ begin: "[", end: "]", innerTokens: tokens },
	{ begin: "{", end: "}", innerTokens: tokens }
);

/**
 * find index of tokens and save the index of start and end of the wantedTokens in a map.
 *
 * @param {string} code is toString of class
 * @returns {Map<number, number>} Map[startIndex]==endIndex and Map[endIndex]==startIndex
 */
const tokenize = function(code, wantedTokens = ["[", "}"]) {
	const tokenIndexesMap = new Map();
	const stack = [];
	let lastToken = { innerTokens: tokens };
	for (let index = 0; index < code.length; ++index) {
		let isEqual = true;
		if (stack.length) {
			lastToken = stack[stack.length - 1].token;
			const end = lastToken.end;
			for (let endIndex = 0; endIndex < end.length; endIndex++) {
				if (end[endIndex] != code[index + endIndex]) isEqual = false;
			}
			if (isEqual) {
				if (wantedTokens.includes(end)) {
					let beginIndex = stack[stack.length - 1].index;
					tokenIndexesMap.set(index, beginIndex);
				}
				if (wantedTokens.includes(lastToken.begin)) {
					let beginIndex = stack[stack.length - 1].index;
					tokenIndexesMap.set(beginIndex, index);
				}
				stack.pop();
				continue;
			}
		}
		for (let token of lastToken.innerTokens) {
			isEqual = true;
			const begin = token.begin;
			for (let beginIndex = 0; beginIndex < begin.length; beginIndex++) {
				if (begin[beginIndex] != code[index + beginIndex]) isEqual = false;
			}
			if (isEqual) {
				stack.push({index, token});
				break;
			}
		}
	}
	return tokenIndexesMap;
};

module.exports = tokenize;
