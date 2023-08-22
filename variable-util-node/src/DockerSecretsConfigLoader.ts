import * as path from 'path';
import {ConfigLoader, Loadable, LoaderValue, VariableLookupError} from '@avanio/variable-util';
import {existsSync} from 'fs';
import {ILoggerLike} from '@avanio/logger-like';
import {readFile} from 'fs/promises';

export interface DockerSecretsConfigLoaderOptions {
	fileLowerCase: boolean;
	path: string;
	/** set to false if need errors */
	isSilent: boolean;
	logger: ILoggerLike | undefined;
	disabled: boolean;
}

export class DockerSecretsConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'docker-secrets';
	private options: Loadable<Partial<DockerSecretsConfigLoaderOptions>>;
	private valuePromises: Record<string, Promise<string | undefined> | undefined> = {};
	private defaultOptions: DockerSecretsConfigLoaderOptions = {
		disabled: false,
		fileLowerCase: false,
		isSilent: true,
		logger: undefined,
		path: '/run/secrets',
	};

	public constructor(options: Loadable<Partial<DockerSecretsConfigLoaderOptions>> = {}) {
		super();
		this.options = options;
		this.getLoader = this.getLoader.bind(this);
	}

	protected async handleLoader(lookupKey: string, overrideKey?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		const targetKey = overrideKey || lookupKey;
		const filePath = this.filePath(targetKey, options);
		if (!this.valuePromises[targetKey]) {
			if (!existsSync(filePath)) {
				if (!options.isSilent) {
					throw new VariableLookupError(targetKey, `ConfigVariables[${this.type}]: ${lookupKey} from ${filePath} not found`);
				}
				options.logger?.debug(`ConfigVariables[${this.type}]: ${lookupKey} from ${filePath} not found`);
				this.valuePromises[targetKey] = Promise.resolve(undefined);
			} else {
				this.valuePromises[targetKey] = readFile(filePath, 'utf8');
			}
		}
		const value = await this.valuePromises[targetKey];
		return {type: this.type, result: {path: filePath, value}};
	}

	private filePath(key: string, options: DockerSecretsConfigLoaderOptions): string {
		return path.join(path.resolve(options.path), options.fileLowerCase ? key.toLowerCase() : key);
	}

	private async getOptions(): Promise<DockerSecretsConfigLoaderOptions> {
		const options = await (typeof this.options === 'function' ? this.options() : this.options);
		return Object.assign({}, this.defaultOptions, options);
	}
}
