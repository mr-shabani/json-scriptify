types = [
	{
		mustCheck: (obj1, obj2) =>
			typeof obj1 == "string" || typeof obj2 == "string",
		isSimilar: (obj1, obj2) => obj1 == obj2
	},
	{
		mustCheck: (obj1, obj2) =>
			typeof obj1 == "bigint" || typeof obj2 == "bigint",
		isSimilar: (obj1, obj2) => obj1 == obj2
	},
	{
		mustCheck: (obj1, obj2) => Object.is(obj1, null) || Object.is(obj2, null),
		isSimilar: (obj1, obj2) => Object.is(obj1, obj2)
	},
	{
		mustCheck: (obj1, obj2) =>
			Object.is(obj1, undefined) || Object.is(obj2, undefined),
		isSimilar: (obj1, obj2) => Object.is(obj1, obj2)
	},
	{
		mustCheck: (obj1, obj2) => Number.isNaN(obj1) || Number.isNaN(obj2),
		isSimilar: (obj1, obj2) => Number.isNaN(obj1) && Number.isNaN(obj2)
	},
	{
		mustCheck: (obj1, obj2) => Object.is(obj1 , Infinity) || Object.is(obj2 , Infinity),
		isSimilar: (obj1, obj2) => Object.is(obj1 , Infinity) && Object.is(obj2 , Infinity)
	},
	{
		mustCheck: (obj1, obj2) => Object.is(obj1 , -Infinity) || Object.is(obj2 , -Infinity),
		isSimilar: (obj1, obj2) => Object.is(obj1 , -Infinity) && Object.is(obj2 , -Infinity)
	}
];
module.exports = types;
