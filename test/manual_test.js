var json_scriptify = require('../');

var obj = {
    x: 1,
    s: new String("str"),
    f: function(){},
    o: {
        x: 2,
        y: 3,
    },
    oo:{
        o: {
            x:4
        }
    },
    d: new Date()
}

obj.c = obj;
obj.oo.o.c = obj.o;
obj.o.c = obj.oo.o;


var script = json_scriptify.withAllFunctions(obj);

console.log(script);

console.log(eval(script));
console.log(obj);
