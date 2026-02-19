/**
 * Custom error class for variable errors.
 * @class VariableError
 * @augments Error
 * @param {string} message - The error message.
 * @category Errors
 * @since v0.2.2
 * @example
 * throw new VariableError('Variable not found');
 */
export class VariableError extends Error {
	/**
	 * Create a new VariableError
	 * @param {string} message - The error message
	 * @param {ErrorOptions} [options] - The error options
	 */
	public constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'VariableError';
	}
}
