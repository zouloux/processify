
/**
 * Quick merge function.
 * @param a object which will get properties from object b.
 * @param b object from which properties will be injected into a.
 */
const merge = function (a, b)
{
	Object.keys( b ).map( key => a[ key ] = b[ key ] );
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
		return (
			// Transform processified file path to be compared argv file path
			filePath.substr( 0, filePath.lastIndexOf('.') ).toLowerCase()
			// And compare it to executed file path
			=== process.argv[1].toLowerCase()
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

		// Execute startup function to map arguments to exported function call
		startupPromise( defaultArguments )

		// When promise is successful
		.then(function ( pResult )
		{
			// Call custom success handler if we have one and give result
			if ( sucessHandler != null )
			{
				sucessHandler( pResult );
			}

			// Otherwise log result as JSON
			else if ( pResult != null )
			{
				console.log( JSON.stringify( pResult ) );
			}

			// Exit with success code
			process.exit( 0 );
		})

		// Catch errors on promises or sync code
		.catch(function ( pError )
		{
			// If we have a custom error handler
			if ( errorHandler != null )
			{
				// Call custom handler and get returned code
				let code = errorHandler( pError );

				// Exit with returned code if valid number
				// Otherwise exit with default code 1
				process.exit( typeof code === 'number' ? code : 1 );
			}
			// If we have a string error without custom error handler 
			else if ( typeof pError === 'string' )
			{
				// Put this string in stderr and exit with default code
				console.error( pError );
			}
			// If we have an object Error
			else if ( typeof pError === 'object' )
			{
				// If this is a native error object
				if ( pError instanceof Error )
				{
					// Put this error with stack in stderr and exit with default code
					console.error( pError );
				}
				// If we have a custom error object with 'message' and 'code props'
				else if ( 'code' in pError && 'message' in pError )
				{
					// Put message in stderr and exit with code
					console.error( pError.message );
					process.exit( pError.code );
				}
			}

			// If error occurs with no error handler and no catched error object
			// Exit with default code 1
			process.exit( 1 );
		});
	}
};