/* eslint-disable no-undef */
let predefined = [
	"global",
	"window",
	"Object",
	"Function",
	"Array",
	"Number",
	"parseFloat",
	"parseInt",
	"Boolean",
	"String",
	"Symbol",
	"Date",
	"Promise",
	"RegExp",
	"Error",
	"EvalError",
	"RangeError",
	"ReferenceError",
	"SyntaxError",
	"TypeError",
	"URIError",
	"ArrayBuffer",
	"Uint8Array",
	"Int8Array",
	"Uint16Array",
	"Int16Array",
	"Uint32Array",
	"Int32Array",
	"Float32Array",
	"Float64Array",
	"Uint8ClampedArray",
	"BigUint64Array",
	"BigInt64Array",
	"DataView",
	"Map",
	"Set",
	"WeakMap",
	"WeakSet",
	"Proxy",
	"decodeURI",
	"decodeURIComponent",
	"encodeURI",
	"encodeURIComponent",
	"escape",
	"unescape",
	"eval",
	"isFinite",
	"isNaN",
	"SharedArrayBuffer",
	"BigInt",
	"Buffer",
	"clearImmediate",
	"clearInterval",
	"clearTimeout",
	"setImmediate",
	"setInterval",
	"setTimeout",
	"URL",
	"URLSearchParams",
	"require",
	"assert",
	"events",
	"stream"
];

predefined.push(
	"Symbol.asyncIterator",
	"Symbol.hasInstance",
	"Symbol.isConcatSpreadable",
	"Symbol.iterator",
	"Symbol.match",
	"Symbol.replace",
	"Symbol.search",
	"Symbol.species",
	"Symbol.split",
	"Symbol.toPrimitive",
	"Symbol.toStringTag",
	"Symbol.unscopables"
);

module.exports = predefined
	.map(script => {
		let value;
		try {
			value = eval(script);
		} catch (e) {
			value = undefined;
		}
		return [value, script];
	})
	.filter(([value]) => Boolean(value));
