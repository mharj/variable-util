import {isRequestNotReadMessage, type RequestNotReady} from '../types/RequestNotReady';
import {ConfigLoader} from './ConfigLoader';
import type {ILoggerLike} from '@avanio/logger-like';
import type {IRequestCache} from '../interfaces/IRequestCache';
import type {LoaderValue} from '../interfaces/IConfigLoader';
import {urlSanitize} from '../lib/formatUtils';
import type {ValidateCallback} from '../interfaces/IValidate';
import {VariableError} from '../VariableError';

/**
 * Options for the FetchConfigLoader
 */
export interface FetchConfigLoaderOptions {
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
	validate: ValidateCallback<Record<string, string | null>, Record<string, string>> | undefined;
	logger: ILoggerLike | undefined;
	cache: IRequestCache | undefined;
	disabled: boolean;
}

export type ConfigRequest = Request | RequestNotReady;

/**
 * FetchConfigRequest is used to load config from a fetch request
 */
export type FetchConfigRequest = ConfigRequest | Promise<ConfigRequest> | (() => ConfigRequest | Promise<ConfigRequest>);

/**
 * FetchConfigLoader is used to load config from a fetch request
 * @category Loaders
 * @implements {IConfigLoader}
 */
export class FetchConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'fetch';
	private request: FetchConfigRequest;
	private dataPromise: Promise<Record<string, string | null>> | undefined;
	private path = 'undefined';
	private options: FetchConfigLoaderOptions;
	private _isLoaded = false;

	private defaultOptions: FetchConfigLoaderOptions = {
		cache: undefined,
		disabled: false,
		fetchClient: typeof window === 'object' ? fetch.bind(window) : fetch,
		isSilent: false,
		logger: undefined,
		payload: 'json',
		validate: undefined,
	};

	/**
	 * Constructor for FetchConfigLoader
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
		// check if disabled
		if (this.options.disabled) {
			return {type: this.type, result: undefined};
		}
		// check if we have JSON data loaded, if not load it
		if (!this.dataPromise || this._isLoaded === false) {
			this.dataPromise = this.fetchData();
		}
		const data = await this.dataPromise;
		const targetKey = overrideKey || lookupKey; // optional override key, else use actual lookupKey
		const value = data?.[targetKey] || undefined;
		return {type: this.type, result: {value, path: this.path}};
	}

	private async fetchData(): Promise<Record<string, string | null>> {
		this._isLoaded = false;
		const req = await this.getRequest();
		if (isRequestNotReadMessage(req)) {
			this.options.logger?.debug(`FetchEnvConfig: ${req.message}`);
			return Promise.resolve({});
		}
		this.path = urlSanitize(req.url); // hide username/passwords from URL in logs
		this.options.logger?.debug(`fetching config from ${this.path}`);
		let res = await this.fetchRequestOrCacheResponse(req);
		if (!res) {
			this.options.logger?.info(`client is offline and not have cached response for FetchEnvConfig`);
			return Promise.resolve({});
		}
		// if we have a cache and valid response, store to cache
		if (res.status === 200 && this.options.cache) {
			await this.options.cache.storeRequest(req, res);
		}
		if (res.status >= 400) {
			// if we have an error and a cached response, use that instead
			res = await this.checkIfValidCacheResponse(req, res);
			// if we still have an error, throw it
			if (res.status >= 400) {
				if (this.options.isSilent) {
					this.options.logger?.info(`http error ${res.status} from FetchEnvConfig`);
					return Promise.resolve({}); // set as empty so we prevent fetch spamming
				}
				throw new VariableError(`http error ${res.status} from FetchEnvConfig`);
			}
		}
		// if we have a cached response and we get a 304, use the cached response instead
		if (res.status === 304) {
			res = await this.handleNotModifiedCache(req, res);
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

	/**
	 * if client is offline, we will try return the cached response else get the response from the fetch request
	 */
	private async fetchRequestOrCacheResponse(req: Request): Promise<Response | undefined> {
		// if we have a cache and we are offline, use the cache
		if (this.options.cache && this.options.cache.isOnline() === false) {
			const cacheRes = await this.options.cache.fetchRequest(req);
			if (cacheRes) {
				return cacheRes;
			}
			return undefined;
		}
		return this.options.fetchClient(req);
	}

	/**
	 * on error, check if we have a valid cached response
	 */
	private async checkIfValidCacheResponse(req: Request, res: Response): Promise<Response> {
		if (this.options.cache) {
			const cacheRes = await this.options.cache.fetchRequest(req);
			if (cacheRes) {
				return cacheRes;
			}
		}
		return res;
	}

	/**
	 * if we get a 304, get the cached response
	 */
	private async handleNotModifiedCache(req: Request, res: Response): Promise<Response> {
		if (this.options.cache) {
			const cacheRes = await this.options.cache.fetchRequest(req);
			if (cacheRes) {
				return cacheRes;
			}
			throw new VariableError(`http error ${res.status} from FetchEnvConfig (using cached version)`); // we have a cache but no cached response
		}
		return res;
	}

	private async handleJson(res: Response): Promise<Record<string, string | null>> {
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
