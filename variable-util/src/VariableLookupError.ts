import {VariableError} from './VariableError';

/**
 * Custom error class for variable lookup errors.
 * @class VariableLookupError
 * @extends VariableError
 * @category Errors
 */
export class VariableLookupError extends VariableError {
	public readonly variableKey: string;
	/**
	 * Create a new VariableLookupError
	 * @param {string} variableKey - The variable key.
	 * @param {string} message - The error message.
	 */
	constructor(variableKey: string, message: string) {
		super(message);
		this.variableKey = variableKey;
		this.name = 'VariableLookupError';
		Error.captureStackTrace(this, this.constructor);
	}
}
