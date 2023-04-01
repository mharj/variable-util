import {VariableError} from './VariableError';

export class VariableLookupError extends VariableError {
	public readonly variableKey: string;
	constructor(variableKey: string, message: string) {
		super(message);
		this.variableKey = variableKey;
		this.name = 'VariableLookupError';
		Error.captureStackTrace(this, this.constructor);
	}
}
