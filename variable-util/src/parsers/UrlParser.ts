import 'url-polyfill';
import {type IConfigParser, type ParserProps} from '../interfaces/IConfigParser';

/**
 * Properties for the UrlParser
 */
export interface UrlParserProps {
	urlSanitize?: boolean;
}

/**
 * UrlParser class is used to parse and validate env variables of type URL.
 * @class UrlParser
 * @implements {IConfigParser<URL, URL>}
 * @category Parsers
 * @since v0.2.5
 */
export class UrlParser implements IConfigParser<URL, URL> {
	public name = 'urlParser';
	/**
	 * Should the username and password be sanitized
	 */
	private urlSanitize: boolean;

	/**
	 * Create a new UrlParser
	 * @param {UrlParserProps} properties - Properties for the UrlParser
	 */
	constructor({urlSanitize}: UrlParserProps = {}) {
		this.urlSanitize = urlSanitize || false;
	}

	public parse({value}: ParserProps): URL {
		try {
			return new URL(value);
		} catch (err) {
			throw err instanceof Error ? err : new Error('unknown error');
		}
	}

	public toString(value: URL): string {
		return value.href;
	}

	public toLogString(value: URL): string {
		if (this.urlSanitize) {
			return this.handleUrlSanitize(value.href);
		}
		return value.toString();
	}

	/**
	 * Build a URL object from a string and sanitize the username and password
	 * @param value string to parse
	 * @returns {URL} URL object with sanitized username and password
	 */
	private handleUrlSanitize(value: string): string {
		const url = new URL(value);
		url.password = '*'.repeat(url.password.length);
		url.username = '*'.repeat(url.username.length);
		return url.href;
	}
}
