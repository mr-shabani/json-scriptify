const funcNameRegexp = /^(class|function)\s+(?<name>[a-zA-Z_]\w*)[\s{(]/;

const functionNameAndPrefixRegexp = [
	/^(?<async>async)?(?<generator>\s*\*)?\s*(?<nameExpression>\[)/,
	/^(?<prefix>(get|set))(?<generator>\s*\*)?\s*(?<nameExpression>\[)/,
	/\{\s*\[(?<prefix>native) code]\s*}$/,
	/^(?<async>async\s+)?(?<prefix>(function|get|set))\s+(?<name>[a-zA-Z_]\w*)\s*\(/,
	/^(?<async>async\s+)?(?<prefix>function)((?<generator>\s*\*\s*)|(\s+))(?<name>[a-zA-Z_]\w*)\s*\(/,
	/^(?<async>async\s*)?\((\s*[a-zA-Z_]\w*\s*,?)*\)\s*=>/,
	/^(?<async>async\s+)?(?<name>[a-zA-Z_]\w*)\s*\(/,
	/^(?<async>async)?(?<generator>\s*\*\s*)?(?<name>[a-zA-Z_]\w*)\s*\(/,
	/^(?<async>async\s+)?(?<prefix>function)\s*\(/,
	/^(?<prefix>class)\s+(?<name>[a-zA-Z_]\w*)[\s{]/,
	/^(?<async>async\s+)?[a-zA-Z_]\w*\s*=>/
];

const analyseFunctionCode = function(code) {
	const funcData = {};
	functionNameAndPrefixRegexp.some(re => {
		const match = code.match(re);
		if (match) {
			const groups = match.groups;
			if (!groups) return true;
			Object.assign(funcData, groups);
			if (groups.prefix == "native") funcData.isNative = true;
			if (groups.generator) funcData.isGenerator = true;
			if (groups.name && !groups.prefix) funcData.isMethod = true;
			if (groups.prefix == "get" || groups.prefix == "set")
				funcData.isGetterSetter = true;
			if (groups.prefix == "class") funcData.isClass = true;
			if (groups.nameExpression) {
				funcData.hasNameExpression = true;
				if (!groups.prefix) funcData.isMethod = true;
			}
			return true;
		}
		return false;
	});
	return funcData;
};

const isExtendableFunction = function(func) {
	try {
		// eslint-disable-next-line no-unused-vars
		class a extends func {}
	} catch (e) {
		return false;
	}
	return true;
};

module.exports = {
	funcNameRegexp,
	analyseFunctionCode,
	isExtendableFunction
};
