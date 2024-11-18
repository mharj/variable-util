import {type IConfigLoaderProps, type LoaderValue, RecordConfigLoader} from '@avanio/variable-util';
import {type ILoggerLike} from '@avanio/logger-like';
import {type IStorageDriver} from 'tachyon-drive';
import {type TachyonConfigStoreType} from './tachyonConfigSerializer';

export type TachyonConfigLoaderOptions = IConfigLoaderProps & {
	logger?: ILoggerLike;
};

/**
 * TachyonConfigLoader
 * @example
 * const driver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonStringSerializer, null);
 * const tachyonConfigLoader = new TachyonConfigLoader(driver);
 * const tachyonEnv = tachyonConfigLoader.getLoader;
 * // using tachyon loader
 * const value = await getConfigVariable('TEST', [tachyonEnv(), env(), fileEnv()], stringParser());
 */
export class TachyonConfigLoader extends RecordConfigLoader<string | undefined, Partial<TachyonConfigLoaderOptions>, TachyonConfigLoaderOptions> {
	public readonly type: Lowercase<string>;
	protected defaultOptions: TachyonConfigLoaderOptions = {
		disabled: false,
	};

	private driver: IStorageDriver<TachyonConfigStoreType>;
	private store: TachyonConfigStoreType = {_v: 1, data: {}};
	private isHydrated = false;

	constructor(driver: IStorageDriver<TachyonConfigStoreType>, options: Partial<TachyonConfigLoaderOptions> = {}, type: Lowercase<string> = 'tachyon') {
		super(options);
		this.driver = driver;
		this.type = type;
	}

	/**
	public async set(key: string, value: string): Promise<void> {
	 * @param key
	 * @param value
	 */
	public async set(key: string, value: string): Promise<void> {
		const options = await this.getOptions();
		this.store.data[key] = value;
		options.logger?.info(`TachyonConfigLoader: Setting ${key} to ${value}`);
		return this.driver.store(this.store);
	}

	/**
	 * Remove a Config variable from the store
	 * @param key
	 */
	public async remove(key: string): Promise<void> {
		const options = await this.getOptions();
		Reflect.deleteProperty(this.store.data, key);
		options.logger?.info(`TachyonConfigLoader: Removing ${key}`);
		return this.driver.store(this.store);
	}

	/**
	 * Get a Config variable from the store
	 * @param key The key to lookup
	 */
	public async get(key: string): Promise<string | undefined> {
		await this.hydratedData();
		return this.store.data[key];
	}

	/**
	 * Clear all Config variables from the store
	 */
	public async clear(): Promise<void> {
		const options = await this.getOptions();
		this.store.data = {};
		options.logger?.info('TachyonConfigLoader: Clearing all data');
		return this.driver.store(this.store);
	}

	protected async handleData(): Promise<Record<string, string | undefined>> {
		await this.hydratedData();
		return this.store.data;
	}

	protected async handleLoader(lookupKey: string, overrideKey: string | undefined): Promise<LoaderValue> {
		// check if we have JSON data loaded, if not load it
		if (!this.dataPromise || !this._isLoaded) {
			this.dataPromise = this.handleData();
		}
		const data = await this.dataPromise;
		const targetKey = overrideKey || lookupKey; // optional override key, else use actual lookupKey
		const value = data[targetKey] || undefined;
		return {type: this.type, result: {value, path: `tachyon:${this.driver.name}/${targetKey}`, seen: this.handleSeen(targetKey, value)}};
	}

	private async hydratedData(): Promise<void> {
		if (!this.isHydrated) {
			const data = await this.driver.hydrate();
			this.isHydrated = true;
			if (data) {
				this.store = data;
			}
		}
	}
}
