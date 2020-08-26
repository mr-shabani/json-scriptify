var definitionList = {
	circularReferences: [],
	functionList: []
};

var traverse = function(obj, path) {
	mark = arguments[2];
	if (!mark) {
		var mark = new Map();
		definitionList.circularReferences = [];
		definitionList.functionList = [];
	}

	if (obj.to_JSON) obj = obj.to_JSON();
	if (typeof obj == "function") {
		definitionList.functionList.push([path, obj.toString()]);
		return;
	}
	if (typeof obj != "object") return;

	if (mark.has(obj)) {
		definitionList.circularReferences.push([path, mark.get(obj)]);
		return;
	}
	mark.set(obj, path);
	Object.entries(obj).forEach(([key, value]) => {
		traverse(value, path + "." + key, mark);
	});
};

module.exports = { definitionList, traverse };
