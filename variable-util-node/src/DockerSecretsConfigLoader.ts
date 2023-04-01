import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import * as path from 'path';
import {ConfigLoader, LoaderValue, VariableLookupError, ILoggerLike} from '@avanio/variable-util/';

export interface DockerSecretsConfigLoaderOptions {
	fileLowerCase: boolean;
	path: string;
	/** set to false if need errors */
	isSilent: boolean;
	logger?: ILoggerLike;
}

export class DockerSecretsConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'docker-secrets';
	private options: DockerSecretsConfigLoaderOptions;
	private valuePromises: Record<string, Promise<string | undefined> | undefined> = {};
	public constructor(options: Partial<DockerSecretsConfigLoaderOptions> = {}) {
		super();
		this.options = {fileLowerCase: false, isSilent: true, path: '/run/secrets', ...options};
		this.getLoader = this.getLoader.bind(this);
	}

	protected async handleLoader(lookupKey: string, overrideKey?: string): Promise<LoaderValue> {
		const targetKey = overrideKey || lookupKey;
		const filePath = this.filePath(targetKey);
		if (!this.valuePromises[targetKey]) {
			if (!existsSync(filePath)) {
				if (!this.options.isSilent) {
					throw new VariableLookupError(targetKey, `ConfigVariables[${this.type}]: ${lookupKey} from ${filePath} not found`);
				}
				this.options.logger?.debug(`ConfigVariables[${this.type}]: ${lookupKey} from ${filePath} not found`);
				this.valuePromises[targetKey] = Promise.resolve(undefined);
			} else {
				this.valuePromises[targetKey] = readFile(filePath, 'utf8');
			}
		}
		const value = await this.valuePromises[targetKey];
		return {value, path: filePath};
	}

	private filePath(key: string): string {
		return path.join(path.resolve(this.options.path), this.options.fileLowerCase ? key.toLowerCase() : key);
	}
}
