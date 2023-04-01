import 'url-polyfill';
import {IConfigParser} from '../interfaces/IConfigParser';

export class UrlParser implements IConfigParser<URL, URL> {
	public name = 'urlParser';
	private urlSanitize: boolean;

	constructor({urlSanitize}: {urlSanitize?: boolean} = {}) {
		this.urlSanitize = urlSanitize || false;
	}

	public parse(key: string, value: string): Promise<URL> {
		try {
			return Promise.resolve(new URL(value));
		} catch (err) {
			throw err instanceof Error ? err : new Error('unknown error');
		}
	}

	public toString(value: URL): string {
		if (this.urlSanitize) {
			return this.handleUrlSanitize(value.href);
		}
		return value.href;
	}

	private handleUrlSanitize(value: string): string {
		const url = new URL(value);
		url.password = '*'.repeat(url.password.length);
		url.username = '*'.repeat(url.username.length);
		return url.href;
	}
}
