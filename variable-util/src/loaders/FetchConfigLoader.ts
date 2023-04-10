import {ConfigLoader} from './ConfigLoader';
import type {ILoggerLike} from '../interfaces/ILoggerLike';
import type {LoaderValue} from '../interfaces/IConfigLoader';
import type {RequestNotReady} from '../types/RequestNotReady';
import {urlSanitize} from '../lib/formatUtils';
import type {ValidateCallback} from '../interfaces/IValidate';
import {VariableError} from '../VariableError';

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
	validate?: ValidateCallback<Record<string, string>, Record<string, string>>;
	logger?: ILoggerLike;
}

type ConfigRequest = Request | RequestNotReady;

type FetchConfigRequest = ConfigRequest | Promise<ConfigRequest> | (() => ConfigRequest | Promise<ConfigRequest>);

function isRequestNotReadMessage(obj: unknown): obj is RequestNotReady {
	return typeof obj === 'object' && obj !== null && 'message' in obj && typeof (obj as RequestNotReady).message === 'string';
}

export class FetchConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'fetch';
	private request: FetchConfigRequest;
	private dataPromise: Promise<Record<string, string>> | undefined;
	private path = 'undefined';
	private options: FetchConfigLoaderOptions;
	private _isLoaded = false;
	private defaultOptions: FetchConfigLoaderOptions = {
		fetchClient: typeof window === 'object' ? fetch.bind(window) : fetch,
		isSilent: false,
		payload: 'json',
		validate: undefined,
	};

	/**
	 *
	 * @param requestCallback - callback that returns a fetch request or a message object that the request is not ready
	 * @param _options
	 */
	constructor(request: FetchConfigRequest, _options: Partial<FetchConfigLoaderOptions> = {}) {
		super();
		this.options = {...this.defaultOptions, ..._options};
		this.request = request;
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

	protected async handleLoader(lookupKey: string, overrideKey: string | undefined): Promise<LoaderValue> {
		// check if we have JSON data loaded, if not load it
		if (!this.dataPromise || this._isLoaded === false) {
			this.dataPromise = this.fetchData();
		}
		const data = await this.dataPromise;
		const targetKey = overrideKey || lookupKey; // optional override key, else use actual lookupKey
		return {value: data?.[targetKey], path: this.path};
	}

	private async fetchData(): Promise<Record<string, string>> {
		this._isLoaded = false;
		const req = await this.getRequest();
		if (isRequestNotReadMessage(req)) {
			this.options.logger?.debug(`FetchEnvConfig: ${req.message}`);
			return Promise.resolve({});
		}
		this.path = urlSanitize(req.url); // hide username/passwords from URL in logs
		this.options.logger?.debug(`fetching config from ${this.path}`);
		const res = await this.options.fetchClient(req);
		if (res.status >= 400) {
			if (this.options.isSilent) {
				this.options.logger?.info(`http error ${res.status} from FetchEnvConfig`);
				return Promise.resolve({}); // set as empty so we prevent fetch spamming
			}
			throw new VariableError(`http error ${res.status} from FetchEnvConfig`);
		}
		const contentType = res.headers.get('content-type');
		if (contentType?.startsWith('application/json') && this.options.payload === 'json') {
			const data = await this.handleJson(res);
			this._isLoaded = true;
			return data;
		}
		if (this.options.isSilent) {
			this.options.logger?.info(`unsupported content-type ${contentType} from FetchEnvConfig`);
			return Promise.resolve({}); // set as empty so we prevent fetch spamming
		}
		throw new VariableError(`unsupported content-type ${contentType} from FetchEnvConfig`);
	}

	private async handleJson(res: Response): Promise<Record<string, string>> {
		const data = await res.json();
		if (this.options.validate) {
			try {
				return await this.options.validate(data);
			} catch (error) {
				const err = error instanceof Error ? error : new Error('unknown error');
				if (this.options.isSilent) {
					this.options.logger?.info(`invalid json response from FetchEnvConfig: ${err.message}`);
					return Promise.resolve({}); // set as empty so we prevent fetch spamming
				}
				throw new VariableError(`invalid json response from FetchEnvConfig: ${err.message}`);
			}
		}
		return data;
	}

	private async getRequest(): Promise<ConfigRequest> {
		return typeof this.request === 'function' ? this.request() : this.request;
	}
}
