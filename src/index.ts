import {ConfigLoader} from './loaders';
import {FormatParameters, printValue} from './formatUtils';
import {LoggerLike} from './loggerLike';

interface ConfigVariablesOptions {
	logger?: LoggerLike;
}

export class ConfigVariables {
	private configs: ConfigLoader[];
	private options: ConfigVariablesOptions;
	constructor(configs: ConfigLoader[], options: ConfigVariablesOptions = {}) {
		this.configs = configs;
		this.options = options;
		this.get = this.get.bind(this);
	}

	// eslint-disable-next-line lines-between-class-members
	public async get(key: string, defaultValue: string, params?: FormatParameters): Promise<string>;
	public async get(key: string, defaultValue?: string | undefined, params?: FormatParameters): Promise<string | undefined>;
	public async get(key: string, defaultValue?: string | undefined, params?: FormatParameters): Promise<string | undefined> {
		for (const config of this.configs) {
			try {
				const {value, path} = await config.get(key);
				if (value) {
					this.options.logger?.info(`ConfigVariables[${config.type}]: ${key}${printValue(value, params)} from ${path}`);
					return value;
				}
			} catch (err) {
				this.options.logger?.error(config.type, err);
			}
		}
		return defaultValue || undefined;
	}
}
