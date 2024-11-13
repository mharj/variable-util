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
		if (value === undefined || value === null) {
			last[key] = undefined;
		} else {
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			last[key] = String(value);
		}
		return last;
	}, {});
}
