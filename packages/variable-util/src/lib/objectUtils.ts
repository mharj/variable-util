/**
 * validate if a value is a valid object
 * @param {unknown} value - value to validate
 * @returns {value is Record<string, unknown>} - true if value is a valid object
 * @since v0.2.5
 */
export function isValidObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value has a toJSON method
 * @param {unknown} value - value to check
 * @returns {value is {toJSON: () => string}} - true if value has a toJSON method
 */
function haveToJSON(value: unknown): value is {toJSON: () => string} {
	return typeof value === 'object' && value !== null && 'toJSON' in value;
}

/**
 * Stringify a value to a string
 * @param {unknown} value - value to stringify
 * @returns {string} - stringified value
 */
function stringifyValue(value: unknown): string {
	if (isValidObject(value)) {
		return haveToJSON(value) ? value.toJSON() : JSON.stringify(value);
	}
	return String(value);
}

/**
 * Convert an object to a string value object
 * @param {Record<string, unknown>} obj - object to convert
 * @returns {Record<string, string | undefined>} - object with string values
 * @since v0.2.5
 */
export function buildStringObject(obj: Record<string, unknown>): Record<string, string> {
	return Object.entries(obj).reduce<Record<string, string>>((last, [key, value]) => {
		if (value) {
			last[key] = stringifyValue(value);
		}
		return last;
	}, {});
}

/**
 * Convert an object to a Map<string, string>
 * @param {Record<string, unknown>} obj - object to convert
 * @returns {Map<string, string>} - Map with string values
 * @since v0.2.5
 */
export function buildStringMap(obj: Record<string, unknown>): Map<string, string> {
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (value) {
			acc.set(key, stringifyValue(value));
		}
		return acc;
	}, new Map<string, string>());
}

/**
 * Apply a Record<string, string> to a Map<string, string>
 * @param {Record<string, string | undefined>} obj - object to apply
 * @param {Map<string, string>} target - Map to apply to
 * @returns {Map<string, string>} - target with updates
 * @since v0.2.5
 */
export function applyStringMap(obj: Record<string, string | undefined>, target: Map<string, string>): Map<string, string> {
	return Object.entries(obj).reduce((acc, [key, value]) => {
		if (value) {
			acc.set(key, value);
		}
		return acc;
	}, target);
}
