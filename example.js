const { processify } = require('./index');



module.exports = {

	myProcessifiedPromise : (paramA, paramB, paramC) => new Promise( (resolve, reject) =>
	{
		setTimeout(function ()
		{
			(paramA == paramB)
			? resolve(paramC)
			: reject(`Params ${paramA} is different from ${paramB}.`, 1)
		}, 500);
	}),

	myProcessifiedSync : function (paramA, paramB, paramC)
	{
		if (paramA != paramB)
		{
			throw new Error(`Params ${paramA} is different from ${paramB}.`, 1);
		}
		return paramC;
	}
};


/**
 * Then we have default arguments which can be overriden from CLI.
 * Arguments are managed with https://github.com/substack/minimist
 * 
 * Args will host flat arguments as an array. This is filled with arguments with no keys.
 * Ex : `node example.js flatA "flat B"`
 * Will be : args[0] = ='flatA' and args[1] == 'flat B'
 *
 * Other props are nammed arguments.
 * Ex : `node example.js --arg1 value1 -arg2=value2 `
 * Will be : { arg1: 'value1', arg2: 'value2', arg3: 'value3' }
 */
processify(
	/**
	 * Default arguments
	 * ( Same as `node example "mode" "default answer" --paramA 1 --paramB 1` )
	 */
	{
		0: 'mode',
		1: 'default answer',
		paramA: 1,
		paramB: 1
	},

	/**
	 * This function is exected if example.js is started from shell.
	 * Will not if example.js is required from another node script.
	 */
	async function ( args )
	{
		console.log('Arguments', args);

		// Get first and second flat arguments
		const mode = args[0];
		const answer = args[1];

		// The point here is to use an exported asset as a CLI function.
		// This is how we make an isomorphic node script

		// Check promise mode if first argument is "promise"
		if ( mode == 'promise' )
		{
			return await module.exports.myProcessifiedPromise(
				args.paramA,
				args.paramB,
				answer
			);
		}

		// Check sync mode if first argument is "sync"
		else if ( mode == 'sync' )
		{
			return module.exports.myProcessifiedSync(
				args.paramA,
				args.paramB,
				answer
			);
		}

		// Throw error if mode argument is invalid
		else throw new Error(`Please select a mode (sync or promise) as first argument.`);
	},

	/**
	 * Executed if previous function is successful.
	 * (optionnal)
	 */
	function ( result )
	{
		console.log(`Custom success handler : ${ result }`);
	},

	/**
	 * Executed if previous function raised an error
	 * (with throw or Promise.reject)
	 * (optionnal)
	 */
	 function (error)
	 {
	 	console.error(`Custom error handler : ${ error }`);
	 }
);