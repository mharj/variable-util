import {buildHiddenValue, type ShowValueType} from './formatUtils';

/**
 * Make the first character of a string lowercase
 * @param {string} data String to make lowercase
 * @returns {string} String with first character lowercase
 * @category Utils
 * @example
 * lcFirst('Hello') // 'hello'
 */
function lcFirst(data: string): string {
	return data.length > 0 ? data.charAt(0).toLowerCase() + data.slice(1) : data;
}

/**
 * Parse a semicolon separated string into a config object
 * @param {string} config Semicolon separated string
 * @param {boolean} [keepCase] Keep the case of the keys, default true
 * @returns {Record<string, string>} Config object
 * @category Utils
 * @since v1.0.0
 * @example
 * parseSemicolonConfig('a=b;c=d') // {a: 'b', c: 'd'}
 */
export function parseSemicolonConfig(config: string, keepCase = true): Record<string, string> {
	return config.split(';').reduce<Record<string, string>>((last, c) => {
		const [k, v] = c.split('=', 2);
		if (k && v) {
			const key = keepCase ? k.trim() : lcFirst(k.trim());
			if (key) {
				last[key] = decodeURIComponent(v.trim());
			}
		}
		return last;
	}, {});
}

/**
 * Stringify a config object to a semicolon separated string
 * @param {Record<string, string>} config Object to stringify
 * @param {boolean} [uriEncode] Use URI encoding for string outputs
 * @returns {string} Stringified config
 * @category Utils
 * @since v1.0.0
 * @example
 * stringifySemicolonConfig({a: 'b', c: 'd'}) // 'a=b;c=d'
 */
export function stringifySemicolonConfig(config: Record<string, unknown>, uriEncode = true): string {
	return Object.entries(config)
		.reduce<string[]>((last, [key, value]) => {
			if (value !== undefined) {
				const encodedValue = uriEncode ? encodeURIComponent(String(value)) : String(value);
				last.push(`${key}=${encodedValue}`);
			}
			return last;
		}, [])
		.join(';');
}

/**
 * Stringify a config object to a semicolon separated string for logging
 * @template Out - Type of output
 * @param {Record<string, string>} config Object to stringify
 * @param {ShowValueType} showProtectedKeys How to show protected keys
 * @param {string[]} protectedKeys list of protected keys
 * @returns {string} Stringified config
 * @category Utils
 * @since v1.0.0
 * @example
 * logStringifySemicolonConfig({a: 'b', c: 'd'}) // 'a=b;c=d'
 */
export function logStringifySemicolonConfig<Out extends Record<string, unknown>>(
	config: Out,
	showProtectedKeys: ShowValueType | undefined,
	protectedKeys: Set<keyof Out>,
): string {
	return Object.entries(config)
		.reduce<string[]>((last, [key, value]) => {
			if (value !== undefined) {
				if (protectedKeys.has(key)) {
					const hiddenValue = buildHiddenValue(String(value), showProtectedKeys);
					last.push(`${key}=${hiddenValue}`);
				} else {
					last.push(`${key}=${String(value)}`);
				}
			}
			return last;
		}, [])
		.join(';');
}
