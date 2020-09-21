var makeFlat = function(arr) {
    let newArray = [];
	arr.forEach(element => {
		if (element instanceof Array) newArray.push(...makeFlat(element));
		else newArray.push(element);
	});
	return newArray;
};

class ExpressionClass {
	constructor() {
		let args = makeFlat([...arguments]).map(x => {
			if (x instanceof ExpressionClass) return x.expression;
			return x;
		});
		this.expression = makeFlat(args);
	}
	toString() {
		return this.expression.join("");
	}
	makeExpression() {
		return new ExpressionClass(...arguments);
	}
	removeAssignment() {
		while (this.expression.length > 0) {
			if (typeof this.expression[0] != "string") {
				this.expression.shift();
			} else {
				let index = this.expression[0].indexOf("=");
				if (index < 0) {
					this.expression.shift();
				} else {
					this.expression[0] = this.expression[0].slice(index + 1);
					break;
				}
			}
		}
		return this;
    }
    isEmpty(){
        return this.expression.length == 0;
    }
}

module.exports = { makeFlat, ExpressionClass };
