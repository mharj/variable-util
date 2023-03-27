export class VariableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'VariableError';
		Error.captureStackTrace(this, this.constructor);
	}
}
