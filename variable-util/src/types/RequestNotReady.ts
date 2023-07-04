/**
 * RequestNotReady indicates that the request is not ready to be loaded yet. (e.g. the user is not logged in)
 * @category Utils
 */
export interface RequestNotReady {
	_type: 'RequestNotReady';
	message: string;
}

/**
 * Type guard for RequestNotReady
 * @param {unknown} obj - object to check if it is a RequestNotReady payload
 * @returns {boolean} boolean indicating if the object is a RequestNotReady payload
 * @category Utils
 */
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

/**
 * function to create a RequestNotReady payload to indicate that the request is not ready to be loaded yet. (e.g. the user is not logged in)
 * @param {string} message - reason why the request is not ready yet
 * @returns {RequestNotReady} RequestNotReady payload
 * @category Utils
 */
export function createRequestNotReady(message: string): RequestNotReady {
	return {message, _type: 'RequestNotReady'};
}
