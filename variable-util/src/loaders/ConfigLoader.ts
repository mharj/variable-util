import {IConfigLoader, LoaderValue} from '../interfaces/';

/**
 * Abstract base class for config loaders
 * @category Loaders
 * @abstract
 */
export abstract class ConfigLoader<HandlerParams> {
	public abstract type: string;
	constructor() {
		this.getLoader = this.getLoader.bind(this); // bind this to getLoader
	}

	/**
	 * builds config loader object and passes extra params to implementation
	 * @param params - optional passing params for handleLoader (i.e. lookup key override, settings etc.)
	 * @returns {IConfigLoader} - IConfigLoader object
	 */
	public getLoader(params?: HandlerParams): IConfigLoader {
		return {
			type: this.type,
			callback: (lookupKey) => this.handleLoader(lookupKey, params),
		};
	}

	/**
	 * implementation of config loader function
	 * @param lookupKey - key to lookup in config
	 * @param params - optional passing params for handleLoader (i.e. lookup key override, settings etc.)
	 */
	protected abstract handleLoader(lookupKey: string, params?: HandlerParams): Promise<LoaderValue>;
}
