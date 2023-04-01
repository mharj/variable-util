/**
 * make first letter as lower case
 */
function lcFirst(data: string) {
	return data.length > 0 ? data.charAt(0).toLowerCase() + data.slice(1) : data;
}

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

export function stringifySemicolonConfig(config: Record<string, string>, keysToHide?: string[]): string {
	return Object.entries(config)
		.reduce<string[]>((last, [key, value]) => {
			if (value && (keysToHide === undefined || !keysToHide.includes(key))) {
				const encodedValue = encodeURIComponent(`${value}`);
				last.push(`${key}=${encodedValue}`);
			}
			return last;
		}, [])
		.join(';');
}
