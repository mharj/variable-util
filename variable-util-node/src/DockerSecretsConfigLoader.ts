import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import * as path from 'path';
import type {ILoggerLike} from '@avanio/logger-like';
import {ConfigLoader, type LoaderValue, VariableLookupError} from '@avanio/variable-util';
import {type Loadable} from '@luolapeikko/ts-common';

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
	public readonly type: Lowercase<string>;
	private valuePromises = new Map<string, Promise<string | undefined>>();
	protected defaultOptions: DockerSecretsConfigLoaderOptions = {
		disabled: false,
		fileLowerCase: false,
		isSilent: true,
		logger: undefined,
		path: '/run/secrets',
	};

	public constructor(options: Loadable<Partial<DockerSecretsConfigLoaderOptions>>, type: Lowercase<string> = 'docker-secrets') {
		super(options);
		this.getLoader = this.getLoader.bind(this);
		this.type = type;
	}

	protected async handleLoader(lookupKey: string, overrideKey?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		const targetKey = overrideKey ?? lookupKey;
		const filePath = this.filePath(targetKey, options);
		let valuePromise = this.valuePromises.get(targetKey) ?? Promise.resolve(undefined);
		const seen = this.valuePromises.has(targetKey); // if valuePromise exists, it means we have seen this key before
		if (!seen) {
			if (!existsSync(filePath)) {
				if (!options.isSilent) {
					throw new VariableLookupError(targetKey, `ConfigVariables[${this.type}]: ${lookupKey} from ${filePath} not found`);
				}
				options.logger?.debug(`ConfigVariables[${this.type}]: ${lookupKey} from ${filePath} not found`);
			} else {
				valuePromise = readFile(filePath, 'utf8');
			}
			// store value promise as haven't seen this key before
			this.valuePromises.set(targetKey, valuePromise);
		}
		const value = await valuePromise;
		return {type: this.type, result: {path: filePath, value, seen}};
	}

	private filePath(key: string, options: DockerSecretsConfigLoaderOptions): string {
		return path.join(path.resolve(options.path), options.fileLowerCase ? key.toLowerCase() : key);
	}
}
