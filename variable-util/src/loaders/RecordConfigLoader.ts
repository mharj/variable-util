import {handleSeen} from '../lib/seenUtils';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

/**
 * RecordConfigLoader is a class that extends ConfigLoader and adds the ability to reload the data.
 * @since v0.8.0
 */
export abstract class RecordConfigLoader<HandlerParams, Props extends IConfigLoaderProps, DefaultProps extends Props = Props> extends ConfigLoader<
	HandlerParams,
	Props,
	DefaultProps
> {
	protected _isLoaded = false;
	protected dataPromise: Promise<Record<string, HandlerParams>> | undefined;
	protected valueSeen = new Map<string, string>();
	protected abstract defaultOptions: DefaultProps | undefined;
	/**
	 * reloads the data
	 */
	public async reload(): Promise<void> {
		this.dataPromise = this.handleData();
		this.valueSeen.clear();
		await this.dataPromise;
		this.emit('updated');
	}

	/**
	 * is the data loaded
	 */
	public isLoaded(): boolean {
		return this._isLoaded;
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

	protected abstract handleData(): Promise<Record<string, HandlerParams>>;
}
