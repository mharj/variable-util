import {ConfigLoader, IConfigLoaderProps} from './ConfigLoader';
import {handleSeen} from '../lib/seenUtils';
import {ILoggerLike} from '@avanio/logger-like';
import type {Loadable} from '../types';
import {LoaderValue} from '../interfaces';

export interface IMemoryConfigLoaderProps extends IConfigLoaderProps {
	logger?: ILoggerLike;
}

/**
 * Config loader with in-memory data which can be set and retrieved variables on the fly.
 * - Useful for temporary controlled overrides or testing
 */
export class MemoryConfigLoader<MemoryMap extends Record<string, string | undefined>> extends ConfigLoader<
	string,
	IMemoryConfigLoaderProps,
	IMemoryConfigLoaderProps
> {
	public readonly type = 'memory';
	protected defaultOptions: IMemoryConfigLoaderProps | undefined;
	private data: Map<keyof MemoryMap, string | undefined>;
	private seen = new Map<string, string>();

	public constructor(initialData: MemoryMap, options: Loadable<IMemoryConfigLoaderProps> = {}) {
		super(options);
		this.getLoader = this.getLoader.bind(this);
		this.data = new Map(Object.entries(initialData));
	}

	public async set(key: keyof MemoryMap, value: string | undefined): Promise<void> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`setting key ${String(key)} to '${value}'`));
		if (this.data.get(key) !== value) {
			this.seen.delete(String(key));
		}
		this.data.set(key, value);
	}

	public async get(key: keyof MemoryMap): Promise<string | undefined> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`getting key ${String(key)}`));
		return this.data.get(key);
	}

	protected async handleLoader(lookupKey: string, overrideKey: string | undefined): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		const targetKey = overrideKey || lookupKey;
		const currentValue = this.data.get(targetKey);
		return {type: this.type, result: {value: currentValue, path: `key:${targetKey}`, seen: handleSeen(this.seen, targetKey, currentValue)}};
	}
}
