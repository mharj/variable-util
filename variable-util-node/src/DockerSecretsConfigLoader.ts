import * as path from 'path';
import {ConfigLoader, type Loadable, type LoaderValue, VariableLookupError} from '@avanio/variable-util';
import {existsSync} from 'fs';
import type {ILoggerLike} from '@avanio/logger-like';
import {readFile} from 'fs/promises';

export interface DockerSecretsConfigLoaderOptions {
	/** force file name to lower case */
	fileLowerCase: boolean;
	/** path to docker secrets, default is '/run/secrets' */
	path: string;
	/** set to false if need errors */
	isSilent: boolean;
	/** optional logger */
	logger: ILoggerLike | undefined;
	/** set to true to disable loader, default is false */
	disabled: boolean;
}

/**
 * Loader for docker secrets, reads secrets from the `/run/secrets` directory.
 * @since v0.8.0
 */
export class DockerSecretsConfigLoader extends ConfigLoader<string | undefined, Partial<DockerSecretsConfigLoaderOptions>, DockerSecretsConfigLoaderOptions> {
	public readonly type = 'docker-secrets';
	private valuePromises: Record<string, Promise<string | undefined> | undefined> = {};
	protected defaultOptions: DockerSecretsConfigLoaderOptions = {
		disabled: false,
		fileLowerCase: false,
		isSilent: true,
		logger: undefined,
		path: '/run/secrets',
	};

	public constructor(options: Loadable<Partial<DockerSecretsConfigLoaderOptions>>) {
		super(options);
		this.getLoader = this.getLoader.bind(this);
	}

	protected async handleLoader(lookupKey: string, overrideKey?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		const targetKey = overrideKey || lookupKey;
		const filePath = this.filePath(targetKey, options);
		const valuePromise = this.valuePromises[targetKey];
		const seen = !!valuePromise; // if valuePromise exists, it means we have seen this key before
		if (!valuePromise) {
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
		return {type: this.type, result: {path: filePath, value, seen}};
	}

	private filePath(key: string, options: DockerSecretsConfigLoaderOptions): string {
		return path.join(path.resolve(options.path), options.fileLowerCase ? key.toLowerCase() : key);
	}
}
