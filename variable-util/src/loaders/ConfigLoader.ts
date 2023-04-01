import {IConfigLoader, LoaderValue} from '../interfaces/';

export abstract class ConfigLoader<HandlerParams> {
	public abstract type: string;
	constructor() {
		this.getLoader = this.getLoader.bind(this); // bind this to getLoader
	}

	/**
	 * builds config loader object and passes extra params to implementation
	 * @param params - optional passing params for handleLoader (i.e. lookup key overriders, settings etc.)
	 * @returns {IConfigLoader} - IConfigLoader object
	 */
	public getLoader(params?: HandlerParams): IConfigLoader {
		return {
			type: this.type,
			callback: (lookupKey) => this.handleLoader(lookupKey, params),
		};
	}

	protected abstract handleLoader(lookupKey: string, params?: HandlerParams): Promise<LoaderValue>;
}
