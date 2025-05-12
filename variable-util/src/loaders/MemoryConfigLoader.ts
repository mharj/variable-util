import {type ILoggerLike} from '@avanio/logger-like';
import {type Loadable} from '@luolapeikko/ts-common';
import {type OverrideKeyMap} from '../interfaces';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

export interface IMemoryConfigLoaderProps extends IConfigLoaderProps {
	logger: ILoggerLike | undefined;
}

/**
 * Config loader with in-memory data which can be set and retrieved variables on the fly.
 * - Useful for temporary controlled overrides or testing
 * @template MemoryMap - the type of the memory map
 * @template OverrideMap - the type of the override key map
 * @since v1.0.0
 * @category Loaders
 */
export class MemoryConfigLoader<MemoryMap extends Record<string, string | undefined>, OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<
	IMemoryConfigLoaderProps,
	OverrideMap
> {
	public readonly loaderType: Lowercase<string>;
	private data: Map<keyof MemoryMap, string | undefined>;

	protected defaultOptions: IMemoryConfigLoaderProps = {
		disabled: false,
		logger: undefined,
	};

	public constructor(
		initialData: MemoryMap,
		options: Loadable<Partial<IMemoryConfigLoaderProps>> = {},
		overrideKeys: Partial<OverrideMap> = {},
		type: Lowercase<string> = 'memory',
	) {
		super(options, overrideKeys);
		this.data = new Map(Object.entries(initialData));
		this.loaderType = type;
	}

	public async set(key: keyof MemoryMap, value: string | undefined): Promise<void> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`setting key ${String(key)} to '${String(value)}'`));
		if (this.data.get(key) !== value) {
			this.valueSeen.delete(String(key));
		}
		this.data.set(key, value);
		this.emit('updated');
	}

	public async get(key: keyof MemoryMap): Promise<string | undefined> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`getting key ${String(key)}`));
		return this.data.get(key);
	}

	protected handleLoaderValue(lookupKey: string) {
		return {value: this.data.get(lookupKey), path: `key:${lookupKey}`};
	}
}
