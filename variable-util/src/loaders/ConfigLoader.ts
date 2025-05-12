import {EventEmitter} from 'events';
import {type Loadable, resolveLoadable} from '@luolapeikko/ts-common';
import {type IConfigLoader, type OverrideKeyMap} from '../interfaces';
import {handleSeen} from '../lib';

/**
 * ConfigLoaderEventMap is the event map for the ConfigLoader
 * @category Loaders
 * @since v0.11.1
 */
export type ConfigLoaderEventMap = {
	/** notify when loader data is updated */
	updated: [];
};

/**
 * IConfigLoaderProps is the interface for ConfigLoader props
 * @category Loaders
 * @since v0.8.0
 */
export interface IConfigLoaderProps {
	disabled?: Loadable<boolean>;
}

export type LoaderValue = {value: string | undefined; path: string};

/**
 * Abstract base class for config loaders
 * @template Props - the type of the props
 * @template OverrideMap - the type of the override key map
 * @category Loaders
 * @abstract
 * @since v1.0.0
 */
export abstract class ConfigLoader<Props extends IConfigLoaderProps, OverrideMap extends OverrideKeyMap = OverrideKeyMap>
	extends EventEmitter<ConfigLoaderEventMap>
	implements IConfigLoader
{
	public abstract loaderType: Lowercase<string>;
	protected abstract defaultOptions: Props;
	protected options: Loadable<Partial<Props>>;
	protected overrideKeys: Partial<OverrideMap>;
	protected valueSeen = new Map<string, string>();

	constructor(props: Loadable<Partial<Props>> = {}, overrideKeys: Partial<OverrideMap> = {}) {
		super();
		this.options = props;
		this.overrideKeys = overrideKeys;
	}

	public async getLoaderResult(lookupKey: string) {
		const loaderValue = await this.handleLoaderValue(this.overrideKeys[lookupKey] ?? lookupKey);
		if (!loaderValue) {
			return undefined;
		}
		return {
			value: loaderValue.value,
			path: loaderValue.path,
			seen: handleSeen(this.valueSeen, lookupKey, loaderValue.value),
		};
	}

	public async isLoaderDisabled() {
		const loadableDisabled = (await this.getOptions()).disabled;
		return resolveLoadable(loadableDisabled);
	}

	public setDisabled(disabled: Loadable<boolean>) {
		return this.setOption('disabled', disabled);
	}

	/**
	 * Get options from loader and merge with default options
	 * @returns {Promise<DefaultProps>} - Promise of DefaultProps & Props
	 */
	protected async getOptions(): Promise<Props> {
		const resolvedOptions = await (typeof this.options === 'function' ? this.options() : this.options);
		return Object.assign({}, this.defaultOptions, resolvedOptions);
	}

	protected async setOption<Key extends keyof Props>(key: Key, value: Props[Key]) {
		this.options = Object.assign({}, await this.getOptions(), {
			[key]: value,
		});
	}

	/**
	 * Build error string `ConfigVariables[<type>]: <message>`
	 * @param {string} message - error message
	 * @returns {string} - error string
	 */
	protected buildErrorStr(message: string): string {
		return `ConfigLoader[${this.loaderType}]: ${message}`;
	}

	/**
	 * implementation of config loader function
	 * @param lookupKey - key to lookup in config
	 * @param params - optional passing params for handleLoader (i.e. lookup key override, settings etc.)
	 * @returns {LoaderValue | Promise<LoaderValue>} - Promise of LoaderValue
	 */
	protected abstract handleLoaderValue(lookupKey: string): undefined | LoaderValue | Promise<undefined | LoaderValue>;
}
