import type {ILoggerLike} from '@avanio/logger-like';
import {ConfigLoader, type LoaderValue, type OverrideKeyMap, VariableLookupError} from '@avanio/variable-util';
import type {Loadable} from '@luolapeikko/ts-common';
import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import * as path from 'path';

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
 * @template OverrideMap Type of the override keys
 * @since v1.0.0
 */
export class DockerSecretsConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<
	DockerSecretsConfigLoaderOptions,
	OverrideMap
> {
	public readonly loaderType: Lowercase<string>;
	private valuePromises = new Map<string, Promise<string | undefined>>();
	protected defaultOptions: DockerSecretsConfigLoaderOptions = {
		disabled: false,
		fileLowerCase: false,
		isSilent: true,
		logger: undefined,
		path: '/run/secrets',
	};

	public constructor(
		options: Loadable<Partial<DockerSecretsConfigLoaderOptions>>,
		overrideKeys?: Partial<OverrideMap>,
		loaderType: Lowercase<string> = 'docker-secrets',
	) {
		super(options, overrideKeys);
		this.loaderType = loaderType;
	}

	protected async handleLoaderValue(lookupKey: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		const filePath = this.filePath(lookupKey, options);
		let valuePromise = this.valuePromises.get(lookupKey) ?? Promise.resolve(undefined);
		const seen = this.valuePromises.has(lookupKey); // if valuePromise exists, it means we have seen this key before
		if (!seen) {
			if (!existsSync(filePath)) {
				if (!options.isSilent) {
					throw new VariableLookupError(lookupKey, `ConfigVariables[${this.loaderType}]: ${lookupKey} from ${filePath} not found`);
				}
				options.logger?.debug(`ConfigVariables[${this.loaderType}]: ${lookupKey} from ${filePath} not found`);
			} else {
				valuePromise = readFile(filePath, 'utf8');
			}
			// store value promise as haven't seen this key before
			this.valuePromises.set(lookupKey, valuePromise);
		}
		return {path: filePath, value: await valuePromise};
	}

	private filePath(key: string, options: DockerSecretsConfigLoaderOptions): string {
		return path.join(path.resolve(options.path), options.fileLowerCase ? key.toLowerCase() : key);
	}
}
