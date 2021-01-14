const { ExpressionClass } = require("../ExpressionClass");
const makeExpression = ExpressionClass.prototype.makeExpression;

const onlyOneVariableNameRegexp = /^[a-zA-Z_]\w*$/;
const onlyHasMembershipRelationsRegexp = /^([a-zA-Z_]\w*\.)+([a-zA-Z_]\w*)$/;

/**
 * Create script of a function that the 'expression'
 * in the function be evaluated as the 'result'.
 * 
 * @param {(string|ExpressionClass)} expression 
 * @param {(string|ExpressionClass)} [ result ] 
 * @returns {?function((string|ExpressionClass):(string|ExpressionClass)=):ExpressionClass}
 */
const makeResultOfExpression = function(expression, result) {
	if (typeof result == "string") result = JSON.stringify(result);
	let FuncArgument, value;
	if (onlyOneVariableNameRegexp.test(expression)) {
		FuncArgument = expression;
		value = Result => Result;
	} else if (onlyHasMembershipRelationsRegexp.test(expression)) {
		const expressionArray = expression.split(".");
		const firstName = expressionArray.shift();
		const endBraces = expressionArray.map(() => "}").join("");
		FuncArgument = firstName;
		value = Result =>
			makeExpression("{", expressionArray.join(":{"), ":", Result, endBraces);
	} else return false;

	return function(code, Result) {
		return makeExpression(
			"(function(",
			FuncArgument,
			"){return ",
			code,
			";})(",
			value(Result || result),
			")"
		);
	};
};

module.exports = makeResultOfExpression;
