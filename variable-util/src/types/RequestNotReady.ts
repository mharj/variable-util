export interface RequestNotReady {
	_type: 'RequestNotReady';
	message: string;
}

export function isRequestNotReadMessage(obj: unknown): obj is RequestNotReady {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'_type' in obj &&
		(obj as RequestNotReady)._type === 'RequestNotReady' &&
		'message' in obj &&
		typeof (obj as RequestNotReady).message === 'string'
	);
}

export function createRequestNotReady(message: string): RequestNotReady {
	return {message, _type: 'RequestNotReady'};
}
