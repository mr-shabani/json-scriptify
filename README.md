# <p align="center">json-scriptify</p>

<p align="center">Convert javascript objects to script</p>

The main goal of this module is to produce a readable and minimum length script from an object that when be evaluated, returns an object as same as possible to the original object.

<span style="font-size: 1.3em;color: orange">&#9888;&#65039;</span>
	CAUTION: We have not implemented a safe parser. So, Don't use this module to send information over the internet.
	This module is designed for use in a babel-plugin and also can be used in the backend or for saving objects.

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
- **Function** : Only the string code of functions( from toString() ) will be added to the script. We cannot copy variables from closures.
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
 var obj;
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
 var obj;
 obj={func:function f() {},arr:Uint8Array.from("e8030000".match(/../g),v=>parseInt(v,16)).buffer,circular:new Set()};
 Object.assign(obj.func.prototype,{sym:Symbol("1")});
 obj.sym=obj.func.prototype.sym;
 _.a=[obj,obj.func.prototype.sym,obj.func,obj.arr,obj.circular];
 _.a.forEach((v)=>{obj.circular.add(v);});
 return obj;
})()
*/
```

Albeit, the size of this script can be less, maybe at later versions.

## License

MIT
