import type {ILoggerLike} from '@avanio/logger-like';
import {applyStringMap, type IConfigLoaderProps, type LoaderValue, MapConfigLoader, type OverrideKeyMap} from '@avanio/variable-util';
import type {IStorageDriver} from 'tachyon-drive';
import type {TachyonConfigStoreType} from './tachyonConfigSerializer';

export type TachyonConfigLoaderOptions = IConfigLoaderProps & {
	logger?: ILoggerLike;
};

/**
 * TachyonConfigLoader
 * @example
 * const driver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonStringSerializer, null);
 * const tachyonEnv = new TachyonConfigLoader(driver);
 * // using tachyon loader
 * const value = await getConfigVariable('TEST', [tachyonEnv, env, fileEnv], stringParser());
 * @template OverrideMap Type of the override keys
 * @since v1.0.0
 */
export class TachyonConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends MapConfigLoader<TachyonConfigLoaderOptions> {
	public readonly loaderType: Lowercase<string>;
	protected defaultOptions: TachyonConfigLoaderOptions = {
		disabled: false,
	};

	public readonly driver: IStorageDriver<TachyonConfigStoreType>;

	public constructor(
		driver: IStorageDriver<TachyonConfigStoreType>,
		options: Partial<TachyonConfigLoaderOptions> = {},
		overrideKeys?: Partial<OverrideMap>,
		loaderType: Lowercase<string> = 'tachyon',
	) {
		super(options, overrideKeys);
		this.loaderType = loaderType;
		this.driver = driver;
		this.driver.on('update', () => void this.loadData());
	}

	/**
	 * Set a Config variable in the store
	 * @param {string} key The key to set
	 * @param {string} value The value to set
	 * @returns {Promise<void>}
	 */
	public async set(key: string, value: string): Promise<void> {
		await this.hydratedData();
		const options = await this.getOptions();
		this.data.set(key, value);
		options.logger?.info(`TachyonConfigLoader: Setting ${key} to ${value}`);
		return this.driver.store(this.getDataAsStore());
	}

	/**
	 * Remove a Config variable from the store
	 * @param {string} key - The key to remove
	 * @returns {Promise<void>}
	 */
	public async remove(key: string): Promise<void> {
		await this.hydratedData();
		const options = await this.getOptions();
		this.data.delete(key);
		options.logger?.info(`TachyonConfigLoader: Removing ${key}`);
		return this.driver.store(this.getDataAsStore());
	}

	/**
	 * Get a Config variable from the store
	 * @param {string} key The key to lookup
	 * @returns {Promise<string | undefined>} The value of the key
	 */
	public async get(key: string): Promise<string | undefined> {
		await this.hydratedData();
		return this.data.get(key);
	}

	/**
	 * Clear all Config variables from the store
	 * @returns {Promise<void>}
	 */
	public async clear(): Promise<void> {
		await this.hydratedData();
		const options = await this.getOptions();
		this.data.clear();
		options.logger?.info('TachyonConfigLoader: Clearing all data');
		return this.driver.store(this.getDataAsStore());
	}

	public size(): number {
		return this.data.size;
	}

	protected async handleLoaderValue(lookupKey: string): Promise<LoaderValue> {
		if (!this._isLoaded) {
			await this.loadData();
			this._isLoaded = true; // only load data once to prevent spamming load requests (use reload method to manually update data)
		}
		const value = this.data.get(lookupKey);
		return {path: `tachyon:${this.driver.name}/${lookupKey}`, value};
	}

	protected async handleLoadData(): Promise<boolean> {
		let logger: ILoggerLike | undefined;
		try {
			logger = (await this.getOptions()).logger;
			this.data.clear();
			const content = await this.driver.hydrate();
			if (content) {
				applyStringMap(content.data, this.data);
				logger?.info(`TachyonConfigLoader: Hydrated store with ${this.data.size.toString()} entries`);
			}
			return !!content;
		} catch (err) {
			logger?.error(err);
			return false;
		}
	}

	private async hydratedData() {
		if (!this._isLoaded) {
			await this.loadData();
			this._isLoaded = true;
		}
	}

	private getDataAsStore(): TachyonConfigStoreType {
		const entries = Array.from(this.data.entries());
		return {
			_v: 1,
			data: entries.reduce<Record<string, string>>((acc, [key, value]) => {
				acc[key] = value;
				return acc;
			}, {}),
		};
	}
}
