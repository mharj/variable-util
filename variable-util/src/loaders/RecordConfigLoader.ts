import {type OverrideKeyMap} from '../interfaces';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

/**
 * RecordConfigLoader is a class that extends ConfigLoader and adds the ability to reload the data.
 * @template Props - the type of the options for the loader
 * @template OverrideMap - the type of the override key map
 * @since v1.0.0
 */
export abstract class RecordConfigLoader<Props extends IConfigLoaderProps, OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<
	Props,
	OverrideMap
> {
	protected abstract defaultOptions: Props;
	protected _isLoaded = false;
	protected dataPromise: Promise<Record<string, string>> | undefined;
	/**
	 * reloads the data
	 */
	public async reload(): Promise<void> {
		this.valueSeen.clear();
		await this.loadData();
	}

	/**
	 * is the data loaded
	 * @returns {boolean} - true if the data is loaded, false otherwise
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
		this.dataPromise = this.handleData();
		await this.dataPromise;
		this.emit('updated');
	}

	protected abstract handleData(): Promise<Record<string, string>>;
}
