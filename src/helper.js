var definitionList = {
	circularReferences: [],
	functionsList: [],
	objectConstructors: []
};

var traverse = function(obj, path) {
	mark = arguments[2];
	if (!mark) {
		var mark = new Map();
		definitionList.circularReferences = [];
		definitionList.functionsList = [];
	}

	if (obj instanceof Date) {
		definitionList.objectConstructors.push([
			path,
			`new Date(${obj.getTime()})`
		]);
		return;
	}
	if (obj instanceof RegExp) {
		definitionList.objectConstructors.push([path, obj.toString()]);
		return;
	}
	if (typeof obj == "bigint") {
		definitionList.objectConstructors.push([path, `BigInt(${obj.toString()})`]);
		return;
	}

	// if (obj.toJSON) obj = obj.toJSON();
	if (typeof obj == "function") {
		definitionList.functionsList.push([path, obj.toString()]);
		return;
	}
	if (typeof obj != "object") return;

	if (mark.has(obj)) {
		definitionList.circularReferences.push([path, mark.get(obj)]);
		return;
	}
	mark.set(obj, path);
	Object.entries(obj).forEach(([key, value]) => {
		traverse(value, path + '[' + JSON.stringify(key)+']', mark);
	});
};

module.exports = { definitionList, traverse };
