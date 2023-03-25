import {LoaderValue} from '../interfaces/IConfigLoader';
import {ConfigLoader} from './ConfigLoader';
import {urlSanitize} from '../lib/formatUtils';
import {ValidateCallback} from '../interfaces/IValidate';

interface FetchConfigLoaderOptions {
	fetchClient: typeof fetch;
	/** this prevents Error to be thrown if have http error */
	isSilent: boolean;
	payload: 'json';
	/**
	 * optional validator for JSON response
	 *
	 * @example
	 * // using zod
	 * const stringRecordSchema = z.record(z.string().min(1), z.string());
	 * const validate: ValidateCallback<Record<string, string>> = async (data) => {
	 *   const result = await stringRecordSchema.safeParseAsync(data);
	 *   if (!result.success) {
	 *     return {success: false, message: result.error.message};
	 *   }
	 *   return {success: true};
	 * };
	 */
	validate?: ValidateCallback<Record<string, string>>;
}

export class FetchConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'fetch';
	private requestCallback: () => Promise<Request>;
	private dataPromise: Promise<Record<string, string>> | undefined;
	private path = 'undefined';
	private options: FetchConfigLoaderOptions;
	private _isLoaded = false;
	private defaultOptions: FetchConfigLoaderOptions = {
		fetchClient: fetch,
		isSilent: false,
		payload: 'json',
		validate: undefined,
	};

	constructor(requestCallback: () => Promise<Request>, _options: Partial<FetchConfigLoaderOptions> = {}) {
		super();
		this.options = {...this.defaultOptions, ..._options};
		this.requestCallback = requestCallback;
	}

	/**
	 * reloads the data from the fetch request
	 */
	public async reload(): Promise<void> {
		this.dataPromise = this.fetchData();
		await this.dataPromise;
	}

	/**
	 * is the data loaded
	 */
	public isLoaded(): boolean {
		return this._isLoaded;
	}

	protected async handleLoader(lookupKey: string, overriderKey: string | undefined): Promise<LoaderValue> {
		// check if we have JSON data loaded, if not load it
		if (!this.dataPromise) {
			this.dataPromise = this.fetchData();
		}
		const data = await this.dataPromise;
		const targetKey = overriderKey || lookupKey; // optional override key, else use actual lookupKey
		return {value: data?.[targetKey], path: this.path};
	}

	private async fetchData(): Promise<any> {
		this._isLoaded = false;
		const req = await this.requestCallback();
		this.path = urlSanitize(req.url); // hide username/passwords from URL in logs
		const res = await this.options.fetchClient(req);
		if (res.status >= 400) {
			if (this.options.isSilent) {
				return Promise.resolve({}); // set as empty so we prevent fetch spamming
			}
			throw new Error(`http error ${res.status} from FetchEnvConfig`);
		}
		const contentType = res.headers.get('content-type');
		if (contentType?.startsWith('application/json') && this.options.payload === 'json') {
			const data = await this.handleJson(res);
			this._isLoaded = true;
			return data;
		}
		throw new Error(`unsupported content-type ${contentType} from FetchEnvConfig`);
	}

	private async handleJson(res: Response): Promise<Record<string, string>> {
		const data = await res.json();
		if (this.options.validate) {
			const res = await this.options.validate(data);
			if (!res.success) {
				throw new Error(`invalid json response from FetchEnvConfig: ${res.message}`);
			}
		}
		return data;
	}
}
