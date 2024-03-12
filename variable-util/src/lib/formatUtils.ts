import {ILoggerLike} from '@avanio/logger-like';

/**
 * Format parameters for the variables
 */
export interface FormatParameters {
	/**
	 * Whether to show the value in the output, defaults to false
	 */
	showValue?: boolean;
	/**
	 * Whether to cache the value on first load, defaults to true
	 */
	cache?: boolean;
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
 * @param {boolean} config.showValue - Whether to include the value in the output.
 * @returns {string} The formatted string representation of the value.
 * @category Utils
 */
export function printValue(value: string | undefined, config: FormatParameters | undefined): string {
	if (!config || !config.showValue) {
		return '';
	}
	return ` [${value}]`;
}

/**
 * Builds a hidden value string, replacing each character with an asterisk.
 */
export function buildHiddenValueString(value: string): string {
	return '*'.repeat(value.length);
}
