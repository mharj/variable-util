import {type ILoggerLike} from '@avanio/logger-like';

export type PartialHiddenValueStringType =
	/** show only prefix of secret "j43****" */
	| 'prefix'
	/**	show only suffix of secret "****7hd" */
	| 'suffix'
	/**	show both prefix and suffix of secret "j43****7hd" */
	| 'prefix-suffix';

export type ShowValueType = boolean | PartialHiddenValueStringType;

/**
 * Format parameters for the variables
 */
export interface FormatParameters {
	/**
	 * Whether to show the value in the output, defaults to undefined
	 * - undefined: hide the value
	 * - true: show the actual value
	 * - false: show the value with asterisks
	 * - 'prefix': show only prefix of value (1-3 characters based on length of the value)
	 * - 'suffix': show only suffix of value (1-3 characters based on length of the value)
	 * - 'both': show both prefix and suffix of value (1-2 characters on suffix and prefix based on length of the value)
	 * @default false
	 */
	showValue?: ShowValueType;
}

/**
 * Sanitizes a URL by replacing the username and password with asterisks.
 * @param {string} value - The URL to sanitize.
 * @param {ILoggerLike} [logger] - An optional logger to use for logging warnings.
 * @returns {string} The sanitized URL.
 * @category Utils
 */
export function urlSanitize(value: string, logger?: ILoggerLike): string {
	try {
		const url = new URL(value);
		url.password = '*'.repeat(url.password.length);
		url.username = '*'.repeat(url.username.length);
		return url.href;
	} catch (err) {
		// warn to log if can't parse url
		logger?.warn('variables:', err);
		return value;
	}
}

/**
 * Returns a formatted string representation of a value, enclosed in square brackets.
 * @param {string | undefined} value - The value to format.
 * @param {FormatParameters | undefined} config - An optional configuration object.
 * @returns {string} The formatted string representation of the value.
 * @category Utils
 */
export function printValue(value: string | undefined, config: FormatParameters | undefined): string {
	if (!value || !config) {
		return '';
	}
	return ` [${buildHiddenValue(value, config.showValue)}]`;
}

export function buildHiddenValue(value: string, show: ShowValueType | undefined): string {
	if (show === true) {
		return value;
	}
	if (!show) {
		return buildHiddenAsterisksValueString(value);
	}
	return buildPartialHiddenValueString(value, show);
}

/**
 * Builds a hidden value string, replacing each character with an asterisk.
 */
export function buildHiddenAsterisksValueString(value: string): string {
	return '*'.repeat(value.length);
}

/**
 * Show only 1-3 characters of the secret value based on length of the value
 */
export function buildPartialHiddenValueString(value: string, type: PartialHiddenValueStringType): string {
	const visibleCharacters = Math.min(3, Math.max(1, Math.floor(value.length * 0.1)));
	switch (type) {
		case 'prefix':
			return `${value.slice(0, visibleCharacters)}${'*'.repeat(value.length - visibleCharacters)}`;
		case 'suffix':
			return `${'*'.repeat(value.length - visibleCharacters)}${value.slice(-visibleCharacters)}`;
		case 'prefix-suffix': {
			const halfOfVisibleCharacters = Math.max(1, Math.ceil(visibleCharacters / 2));
			return `${value.slice(0, halfOfVisibleCharacters)}${'*'.repeat(value.length - halfOfVisibleCharacters * 2)}${value.slice(-halfOfVisibleCharacters)}`;
		}
	}
}
