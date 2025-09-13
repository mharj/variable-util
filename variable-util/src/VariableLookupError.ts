import {VariableError} from './VariableError';

/**
 * Custom error class for variable lookup errors.
 * @class VariableLookupError
 * @augments VariableError
 * @category Errors
 * @since v0.2.2
 */
export class VariableLookupError extends VariableError {
	public readonly variableKey: string;
	/**
	 * Create a new VariableLookupError
	 * @param {string} variableKey - The variable key.
	 * @param {string} message - The error message.
	 * @param {ErrorOptions} [options] - The error options
	 */
	constructor(variableKey: string, message: string, options?: ErrorOptions) {
		super(message, options);
		this.variableKey = variableKey;
		this.name = 'VariableLookupError';
	}
}
