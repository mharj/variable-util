import {Config} from './config';
import {LoggerLike} from './loggerLike';

export interface IParameters {
	showValue?: boolean;
	sanitizeUrl?: boolean;
}

interface VariablesOptions {
	logger?: LoggerLike;
}

export class Variables {
	private configs: Config[];
	private options: VariablesOptions;
	constructor(configs: Config[], options: VariablesOptions = {}) {
		this.configs = configs;
		this.options = options;
		this.get = this.get.bind(this);
	}
	// eslint-disable-next-line lines-between-class-members
	public async get(key: string, defaultValue: string, params?: IParameters): Promise<string>;
	public async get(key: string, defaultValue?: string | undefined, params?: IParameters): Promise<string | undefined>;
	public async get(key: string, defaultValue?: string | undefined, params?: IParameters): Promise<string | undefined> {
		for (const config of this.configs) {
			try {
				const {value, path} = await config.get(key);
				if (value) {
					this.options.logger?.info(`variables: ${key}${printValue(key, params)} from ${path}`);
					return value;
				}
			} catch (err) {
				this.options.logger?.error(config.type, err);
			}
		}
		return defaultValue || undefined;
	}
}

export function urlSanitize(value: string, logger?: LoggerLike): string {
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

export function printValue(value: string | undefined, config: IParameters | undefined) {
	if (!config || (!config.showValue && !config.sanitizeUrl)) {
		return '';
	}
	if (value && config.sanitizeUrl) {
		return ` [${urlSanitize(value)}]`;
	}
	return ` [${value}]`;
}
