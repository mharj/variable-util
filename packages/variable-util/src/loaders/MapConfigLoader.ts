import type {OverrideKeyMap} from '../interfaces';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

/**
 * MapConfigLoader is a class that extends ConfigLoader and adds the ability to reload the data.
 * @template Props - the type of the options for the loader
 * @template OverrideMap - the type of the override key map
 * @since v1.0.0
 * @category Loaders
 */
export abstract class MapConfigLoader<Props extends IConfigLoaderProps, OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<
	Props,
	OverrideMap
> {
	protected abstract defaultOptions: Props;
	protected _isLoaded = false;
	protected data: Map<string, string> = new Map<string, string>();
	/**
	 * clear maps and reloads the data
	 */
	public async reload(): Promise<void> {
		this.data.clear();
		this.valueSeen.clear();
		await this.loadData();
	}

	/**
	 * is the data loaded
	 * @returns {boolean} Whether the data is loaded
	 */
	public isLoaded(): boolean {
		return this._isLoaded;
	}

	/**
	 * load data from the loader. If the data is loaded successfully
	 * an "updated" event will be emitted.
	 * @returns {Promise<void>}
	 */
	protected async loadData(): Promise<void> {
		if (await this.handleLoadData()) {
			this.emit('updated');
		}
	}

	protected abstract handleLoadData(): Promise<boolean>;
}
