import {ILoggerLike} from '../interfaces/';

export interface FormatParameters {
	showValue?: boolean;
}

export function urlSanitize(value: string, logger?: ILoggerLike): string {
	try {
		const url = new URL(value);
		url.password = '*'.repeat(url.password.length);
		url.username = '*'.repeat(url.username.length);
		return url.href;
	} catch (err) {
		// warn to log if can't parse url
		logger && logger.warn('variables:', err);
		return value;
	}
}

export function printValue(value: string | undefined, config: FormatParameters | undefined) {
	if (!config || !config.showValue) {
		return '';
	}
	return ` [${value}]`;
}
