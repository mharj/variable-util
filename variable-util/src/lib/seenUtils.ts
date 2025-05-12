/**
 * Function to check if we have seen a value before and update the seenMap
 * @param {Map<string, string>} seenMap - Map of seen values
 * @param {string} key - key to check
 * @param {string | undefined} value - value to check
 * @returns {boolean} - true if already seen value, false if not
 * @since v1.0.0
 */
export function handleSeen(seenMap: Map<string, string>, key: string, value: string | undefined): boolean {
	// ignore undefined values
	if (value === undefined) {
		return false;
	}
	const lastValue = seenMap.get(key);
	const seen = value === lastValue;
	if (!seen) {
		seenMap.set(key, value);
	}
	return seen;
}
