import {ConfigLoader} from './ConfigLoader';

/**
 * RecordConfigLoader is a class that extends ConfigLoader and adds the ability to reload the data.
 */
export abstract class RecordConfigLoader<HandlerParams> extends ConfigLoader<HandlerParams> {
	protected _isLoaded = false;
	protected dataPromise: Promise<Record<string, HandlerParams>> | undefined;
	/**
	 * reloads the data
	 */
	public async reload(): Promise<void> {
		this.dataPromise = this.handleData();
		await this.dataPromise;
	}

	/**
	 * is the data loaded
	 */
	public isLoaded(): boolean {
		return this._isLoaded;
	}

	protected abstract handleData(): Promise<Record<string, HandlerParams>>;
}
