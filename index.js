
/**
 * Quick merge function.
 * @param a object which will get properties from object b.
 * @param b object from which properties will be injected into a.
 */
const merge = function (a, b)
{
	Object.keys( b ).map( key => a[ key ] = b[ key ] );
}

/**
 * Remove extension of a file path.
 * Will remove everything after the last dot.
 */
const removeExtension = function ( filePath )
{
	const lastDotIndex = filePath.lastIndexOf('.');
	return (
		(lastDotIndex === -1)
		? filePath
		: filePath.substr( 0, lastDotIndex)
	);
}

module.exports = {
	
	/**
	 * Check if a file path is the CLI startup point.
	 * Will compare filePath with process.argv[1].
	 * Will simplify paths to remove file extension and case.
	 * Ex : 'node my-file.js' will be true if filePath is 'my-file'
	 * @param filePath File path to check. Will be simplified without extension and case.
	 * @returns 
	 */
	isInvoked: function (filePath)
	{
		// Do not continue if executed file name from CLI is invalid
		if ( !(1 in process.argv) || typeof(process.argv[1]) !== 'string' ) return false;

		// Check if processified file path is the same of the file path executed from CLI
		// We remove extension and test as lowerCase for silly configured envs ...
		return (
			removeExtension( filePath ).toLowerCase()
			===
			removeExtension( process.argv[1] ).toLowerCase()
		);
	},

	/**
	 * Inverse of isInvoked.
	 * Will return true if main file is required.
	 * Will return false if main file is directly invoked from shell.
	 * @param filePath File path to check. Will be simplified without extension and case.
	 */
	isRequired: function (filePath)
	{
		return module.exports.isInvoked( filePath );
	},

	/**
	 * TODO DOC
	 */
	processify: function (defaultArguments, startupPromise, sucessHandler, errorHandler)
	{
		// ----- CHECK IF STARTED FROM CLI

		// Get processified file name
		const processifiedFileName = module.parent.filename

		// If this is not the startup file, we quit and let node use module.exports
		if (!module.exports.isRequired( processifiedFileName ) ) return;

		// ----- COMPUTE ARGUMENTS

		// Get Shell arguments list with minimist
		const parsedArguments = require('minimist')( process.argv.slice(2) );

		// Get flat arguments and merge them over default flat arguments
		merge(defaultArguments, parsedArguments['_']);

		// Delete _ from minimist and merge named arguments over default named arguments
		delete parsedArguments['_'];
		merge(defaultArguments, parsedArguments);

		// ----- EXECUTE

		// When startup function succeed
		function success ( result )
		{

			// Call custom success handler if we have one and give result
			if ( sucessHandler != null )
			{
				sucessHandler( result );
			}

			// Otherwise log result as JSON
			else if ( result != null )
			{
				console.log( JSON.stringify( result ) );
			}

			// Exit with success code
			process.exit( 0 );
		}

		// When startup function fails
		function fail (error)
		{
			// If we have a custom error handler
			if ( errorHandler != null )
			{
				// Call custom handler and get returned code
				let code = errorHandler( error );

				// Exit with returned code if valid number
				// Otherwise exit with default code 1
				process.exit( typeof code === 'number' ? code : 1 );
			}
			// If we have a string error without custom error handler 
			else if ( typeof error === 'string' )
			{
				// Put this string in stderr and exit with default code
				console.error( error );
			}
			// If we have an object Error
			else if ( typeof error === 'object' )
			{
				// If this is a native error object
				if ( error instanceof Error )
				{
					// Put this error with stack in stderr and exit with default code
					console.error( error );
				}
				// If we have a custom error object with 'message' and 'code props'
				else if ( 'code' in error && 'message' in error )
				{
					// Put message in stderr and exit with code
					console.error( error.message );
					process.exit( error.code );
				}
			}

			// If error occurs with no error handler and no catched error object
			// Exit with default code 1
			process.exit( 1 );
		}

		// Execute startup function to map arguments to exported function call
		let returnedPromise;
		try
		{
			returnedPromise = startupPromise( defaultArguments )
		}

		// Execute fail if we catched a sync error
		catch (e) { fail( e ) }

		// Check if startup returns a promise
		if (returnedPromise != null && returnedPromise instanceof Promise)
		{
			// When promise is successful
			returnedPromise.then(success);

			// Catch errors on promises
			returnedPromise.catch(fail);
		}
	}
};