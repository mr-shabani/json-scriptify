var checkSimilarity = function(obj1, obj2, ignoreFunctions) {
	var mark = arguments[3] || new Map();

	if (typeof obj1 != "object" || typeof obj2 != "object") {
		if (typeof obj1 == "function" && typeof obj2 == "function") {
            if (ignoreFunctions) return true;
			return obj1.toString() == obj2.toString();
		}
		if(obj1!=obj2)
			console.log("diff : ",obj1," != ",obj2);
		return obj1 == obj2;
	}

	if (mark.has(obj1)) return mark.get(obj1) == obj2;

	mark.set(obj1, obj2);

	var returnValue = true;
	Object.entries(obj1).forEach(([key, value]) => {
		if (returnValue)
			returnValue =
				returnValue && checkSimilarity(value, obj2[key], ignoreFunctions, mark);
	});
	return returnValue;
};

module.exports = checkSimilarity;
