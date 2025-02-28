/**
 * validate if a value is a valid object
 * @param value - value to validate
 * @returns {value is Record<string, unknown>} - true if value is a valid object
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Convert an object to a string value object
 * @param obj - object to convert
 * @returns {Record<string, string | undefined>} - object with string values
 */
export function buildStringObject(obj: Record<string, unknown>): Record<string, string | undefined> {
	return Object.entries(obj).reduce<Record<string, string | undefined>>((last, [key, value]) => {
		if (value) {
			last[key] = String(value);
		}
		return last;
	}, {});
}

export function buildStringMap(obj: Record<string, unknown>): Map<string, string> {
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (value) {
			acc.set(key, String(value));
		}
		return acc;
	}, new Map<string, string>());
}

export function applyStringMap(obj: Record<string, string | undefined>, target: Map<string, string>): Map<string, string> {
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (value) {
			acc.set(key, value);
		}
		return acc;
	}, target);
}
