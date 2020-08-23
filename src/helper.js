var mark = new Map();
var definitionList = {
circularReferences : [],
functionList : []
};

var traverse = function(obj, path,isNotRoot) {
	if (isNotRoot == undefined) {
		mark.clear();
		definitionList.circularReferences = [];
		functionList = [];
	}
	if (obj.to_JSON) obj = obj.to_JSON();
	if (typeof obj != "object") return;
	if (mark.has(obj)) {
		definitionList.circularReferences.push([path, mark.get(obj)]);
		return;
	}
	mark.set(obj, path);
	Object.entries(obj).forEach(([key, value]) => {
		traverse(value, path + "." + key,true);
	});
};

module.exports = { mark, definitionList, traverse };
