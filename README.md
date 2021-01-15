# <p align="center">json-scriptify</p>

<p align="center">Convert javascript objects to script</p>

The main goal of this module is to produce a readable and minimum length script from an object that when be evaluated, returns an object as same as possible to the original object.

<div style="border:1px solid black;padding:.1em 2em;margin:0px 2em">
<span style="font-size: 1.3em;color: orange">&#9888;&#65039;</span>
CAUTION: We have not implemented a safe parser. So, Don't use this module to send information over the internet.
This module is designed for use in a babel-plugin and also can be used in the backend or for saving objects.
</div>

## Features

Circular references and repeated references are supported.

Supported built-in objects :

- **Number** : primitive type and object
- **Boolean** : primitive type and object
- **String** : primitive type and object
- **Symbol** : primitive type and object
- **BigInt**
- **Date**
- **RegExp**
- **Map**
- <span style="font-size: 1.3em;color: red">&#9888;&#65039;</span> <span style="background-color:#fcc">**WeakMap** cannot be converted to script. </span>
- **Set**
- <span style="font-size: 1.3em;color: red">&#9888;&#65039;</span> <span style="background-color:#fcc">**WeakSet** cannot be converted to script. </span>
- **Errors** : Error, TypeError, EvalError, SyntaxError, RangeError, ReferenceError, URIError
- **ArrayBuffer**
- **SharedArrayBuffer**
- **Typed Arrays** : Int8Array, ... , Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array
- **DataView**
- **Function** : Only the string code of functions( from toString() ) will be added to the script. We cannot copy variables from closures. Also, methods, getters, setters and generator functions are supported.
  - <span style="font-size: 1.3em;color: red">&#9888;&#65039;</span> <span style="background-color:#fcc"> Bound functions cannot be converted to script.</span>
- **Classes** : Only the string code of classes (from toString() ) and their **parent classes** will be added to the script. We cannot copy variables from closures.

Also, all properties of any object, either enumerables or non enumerables properties, will be converted to script. ( \_\_proto\_\_ is not supported yet)

Some predefined values in javascript such as `Symbol.match` or `window` object are defined.

## Installation

You can install this module via [npm](https://www.npmjs.com/).

```
npm install json-scriptify
```

## Usage

```javascript
var scriptify = require("json-scriptify");

let scriptString = scriptify(object, Replacer, options);
```

`Replacer` is a function from any object to any object.

`options` is a object that can contain `lineBreak` and `predefined` keys.
By default,`lineBreak` is "\n ".

### Simple object with circular

```javascript
let scriptify = require("json-scriptify");

let obj = { num: 1, str: "string", date: new Date(), re: /any regex/g };
var script = scriptify(obj);

console.log(script);
// ({num:1,str:"string",date:new Date(1601920112100),re:/any regex/g})

obj.circular = obj;
obj.repeated = obj.date;

script = scriptify(obj);

console.log(script);
/*
(function(){
 let obj;
 obj={num:1,str:"string",date:new Date(1601920884331),re:/any regex/g};
 obj.circular=obj;
 obj.repeated=obj.date;
 return obj;
})()
*/
```

### A bit more complex object

```javascript
let scriptify = require("json-scriptify");

let obj = {
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
/*
(function(){
 const _={};
 let obj;
 obj={func:function () {},arr:Uint8Array.from("e8030000".match(/../g),v=>parseInt(v,16)).buffer,circular:new Set()};
 Object.assign(obj.func.prototype,{sym:Symbol("1")});
 obj.sym=obj.func.prototype.sym;
 _.a=[obj,obj.func.prototype.sym,obj.func,obj.arr,obj.circular];
 _.a.forEach(v=>{obj.circular.add(v);});
 return obj;
 })()
*/
```

Albeit, the size of this script can be less, maybe at later versions.

### Replacer

usage of `Replacer` is like as `JSON.stringify` Replacer. But without `key` and `this` arguments. Only the `value` that we want to produce script of it, will be passed to `Replacer`.

```javascript
let scriptify = require("json-scriptify");

let obj = { num: 1, str: "string", date: new Date(), re: /any regex/g };

let replacer = function(value) {
	if (typeof value == "object" && value !== obj) return;
	return value;
};

var script = scriptify(obj, replacer);

console.log(script);
// ({num:1,str:"string",date:undefined,re:undefined})
```

If you want to ignore some values from being in the script, you can use `scriptify.ignore`.
If the replacer returns `scriptify.ignore`, this value will be removed from the script. And, if this value is a key of an object, both the key and its value will be ignored.

If you only want to ignore some properties of an object from the script, you can use `scriptify.ignoreSomeProps` function.
This function takes two arguments. The first is the object and the second is a list of keys that must be ignored.

```javascript
let obj = {
	num: 1,
	str: "string",
	date: new Date(),
	re: /any regex/g,
	o: { preserve: 1, mustBeIgnored: 2 }
};

let replacer = function(value) {
	if (value instanceof Date) return scriptify.ignore;
	if (typeof value == "object")
		return scriptify.ignoreSomeProps(value, ["mustBeIgnored"]);
	return value;
};

var script = scriptify(obj, replacer);

console.log(script);
// ({num:1,str:"string",re:/any regex/g,o:{preserve:1}})
```

### predefined values

We defined some predefined values in [`predefinedValues.js`]() file. Until now, we only add global functions such as `Map`, `eval`, or `String` and symbols in the `Symbol` object such as `Symbol.iterator`.

You can add your predefined values in `options.predefined`.

```javascript
options = {predefined:[ ["script1",value1],["script2",value2], ... ]}
```

#### example

```javascript
let scriptify = require("json-scriptify");

let parentClass = class a {};
let obj = class myExtendedClass extends parentClass {};

var script = scriptify(obj, null, {
	predefined: [["parentClass", parentClass]]
});

console.log(script);
/*
(function(){
 const _={};
 let obj;
 obj=(function(){
 return class myExtendedClass extends parentClass {};
 })();
 _.a={length:{value:0,configurable:true},name:{value:"myExtendedClass",configurable:true}};
 Object.defineProperties(obj,_.a);
 return obj;
 })())
*/
```

## License

MIT
