import {IConfigLoader, LoaderValue} from '../interfaces/';
import {Loadable} from '../types/Loadable';

export interface IConfigLoaderProps {
	disabled?: boolean | Promise<boolean> | (() => boolean | Promise<boolean>);
}

/**
 * Abstract base class for config loaders
 * @category Loaders
 * @abstract
 */
export abstract class ConfigLoader<HandlerParams, Props extends IConfigLoaderProps, DefaultProps extends Props = Props> {
	public abstract type: string;
	protected options: Loadable<Props>;
	protected abstract defaultOptions: DefaultProps | undefined;

	constructor(props: Loadable<Props>) {
		this.getLoader = this.getLoader.bind(this); // bind this to getLoader
		this.options = props;
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
	 * Check if loader is disabled
	 * @returns {Promise<boolean | undefined>} - Promise of boolean or undefined
	 */
	public async isDisabled(): Promise<boolean | undefined> {
		const loadableDisabled = (await this.getOptions()).disabled;
		return typeof loadableDisabled === 'function' ? loadableDisabled() : loadableDisabled;
	}

	/**
	 * Get options from loader and merge with default options
	 * @returns {Promise<DefaultProps>} - Promise of DefaultProps & Props
	 */
	protected async getOptions(): Promise<DefaultProps & Props> {
		const resolvedOptions = await (typeof this.options === 'function' ? this.options() : this.options);
		return Object.assign({}, this.defaultOptions, resolvedOptions);
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
