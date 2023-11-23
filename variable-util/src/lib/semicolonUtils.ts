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
 * @example
 * parseSemicolonConfig('a=b;c=d') // {a: 'b', c: 'd'}
 */
export function parseSemicolonConfig(config: string, keepCase = true): Record<string, string> {
	return config.split(';').reduce<Record<string, string>>((last, c) => {
		const [k, v] = c.split('=', 2);
		const key = keepCase ? k.trim() : lcFirst(k.trim());
		if (key) {
			last[key] = decodeURIComponent(v?.trim());
		}
		return last;
	}, {});
}

/**
 * Stringify a config object to a semicolon separated string
 * @param {Record<string, string>} config Object to stringify
 * @param {string[]} [keysToHide] Keys to hide from the output log
 * @returns {string} Stringified config
 * @category Utils
 * @example
 * stringifySemicolonConfig({a: 'b', c: 'd'}) // 'a=b;c=d'
 */
export function stringifySemicolonConfig(config: Record<string, unknown>, keysToHide?: string[]): string {
	return Object.entries(config)
		.reduce<string[]>((last, [key, value]) => {
			if (value !== undefined && (keysToHide === undefined || !keysToHide.includes(key))) {
				const encodedValue = encodeURIComponent(`${value}`);
				last.push(`${key}=${encodedValue}`);
			}
			return last;
		}, [])
		.join(';');
}
