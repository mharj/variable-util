import {handleSeen} from '../lib/seenUtils';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

/**
 * MapConfigLoader is a class that extends ConfigLoader and adds the ability to reload the data.
 * @since v0.13.0
 */
export abstract class MapConfigLoader<HandlerParams, Props extends IConfigLoaderProps, DefaultProps extends Props = Props> extends ConfigLoader<
	HandlerParams,
	Props,
	DefaultProps
> {
	protected abstract defaultOptions: DefaultProps | undefined;
	protected _isLoaded = false;
	protected data = new Map<string, HandlerParams>();
	protected valueSeen = new Map<string, string>();
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

	/**
	 * Set seen value and return last "seen" value
	 * @param targetKey
	 * @param currentValue
	 * @returns
	 */
	protected handleSeen(targetKey: string, currentValue: string | undefined): boolean {
		return handleSeen(this.valueSeen, targetKey, currentValue);
	}

	protected abstract handleLoadData(): Promise<boolean>;
}
