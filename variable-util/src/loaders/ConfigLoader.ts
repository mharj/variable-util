import {IConfigLoader, LoaderValue} from '../interfaces/';

export interface IConfigLoaderProps {
	disabled?: boolean | Promise<boolean> | (() => boolean | Promise<boolean>);
}

/**
 * Abstract base class for config loaders
 * @category Loaders
 * @abstract
 */
export abstract class ConfigLoader<HandlerParams> {
	public abstract type: string;
	private loaderOptions: IConfigLoaderProps;
	constructor(props: IConfigLoaderProps) {
		this.getLoader = this.getLoader.bind(this); // bind this to getLoader
		this.loaderOptions = props;
	}

	/**
	 * builds config loader object and passes extra params to implementation
	 * @param params - optional passing params for handleLoader (i.e. lookup key override, settings etc.)
	 * @returns {IConfigLoader} - IConfigLoader object
	 */
	public getLoader(params?: HandlerParams): IConfigLoader {
		return {
			type: this.type,
			callback: (lookupKey) => this.callLoader(lookupKey, params),
		};
	}

	/**
	 * Call the loader function if not disabled
	 * @param lookupKey - key to lookup in config
	 * @param params - optional passing params for handleLoader (i.e. lookup key override, settings etc.)
	 * @returns {Promise<LoaderValue>} - Promise of LoaderValue
	 */
	private async callLoader(lookupKey: string, params?: HandlerParams): Promise<LoaderValue> {
		if (await this.isDisabled()) {
			return {type: this.type, result: undefined};
		}
		return this.handleLoader(lookupKey, params);
	}

	/**
	 * Check if current loader is disabled
	 * @returns {boolean | undefined | Promise<boolean | undefined>} - boolean if loader is disabled, undefined if not
	 */
	private isDisabled(): boolean | undefined | Promise<boolean | undefined> {
		return typeof this.loaderOptions.disabled === 'function' ? this.loaderOptions.disabled() : this.loaderOptions.disabled;
	}

	/**
	 * implementation of config loader function
	 * @param lookupKey - key to lookup in config
	 * @param params - optional passing params for handleLoader (i.e. lookup key override, settings etc.)
	 * @returns {Promise<LoaderValue>} - Promise of LoaderValue
	 */
	protected abstract handleLoader(lookupKey: string, params?: HandlerParams): Promise<LoaderValue>;

	/**
	 * Build error string "ConfigVariables[<type>]: <message>"
	 * @param message - error message
	 * @returns {string} - error string
	 */
	protected buildErrorStr(message: string): string {
		return `ConfigLoader[${this.type}]: ${message}`;
	}
}
