/**
 * Custom error class for variable errors.
 * @class VariableError
 * @extends Error
 * @param {string} message - The error message.
 * @category Errors
 * @example
 * throw new VariableError('Variable not found');
 */
export class VariableError extends Error {
	/**
	 * Create a new VariableError
	 * @param {string} message - The error message
	 */
	constructor(message: string) {
		super(message);
		this.name = 'VariableError';
		Error.captureStackTrace(this, this.constructor);
	}
}
