import {buildStringObject, isValidObject} from '../lib';
import {isRequestNotReadMessage, type RequestNotReady} from '../types/RequestNotReady';
import type {IConfigLoaderProps} from './ConfigLoader';
import type {ILoggerLike} from '@avanio/logger-like';
import type {IRequestCache} from '../interfaces/IRequestCache';
import type {Loadable} from '../types/Loadable';
import type {LoaderValue} from '../interfaces/IConfigLoader';
import {RecordConfigLoader} from './RecordConfigLoader';
import {urlSanitize} from '../lib/formatUtils';
import type {ValidateCallback} from '../interfaces/IValidate';
import {VariableError} from '../VariableError';

/**
 * Options for the FetchConfigLoader
 */
export interface FetchConfigLoaderOptions extends IConfigLoaderProps {
	fetchClient: typeof fetch;
	/** this prevents Error to be thrown if have http error */
	isSilent: boolean;
	payload: 'json';
	/**
	 * optional validator for JSON response (Record<string, string | undefined>)
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
	validate: ValidateCallback<Record<string, string | undefined>, Record<string, string | undefined>> | undefined;
	logger: ILoggerLike | undefined;
	cache: IRequestCache | undefined;
	/** if we get a cache hit code (defaults 304), we use the cached response instead */
	cacheHitHttpCode: number;
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
 * @since v0.8.0
 */
export class FetchConfigLoader extends RecordConfigLoader<string | undefined, Partial<FetchConfigLoaderOptions>, FetchConfigLoaderOptions> {
	public readonly type: Lowercase<string>;
	private request: FetchConfigRequest;
	private path = 'undefined';

	protected defaultOptions: FetchConfigLoaderOptions = {
		cache: undefined,
		cacheHitHttpCode: 304,
		disabled: false,
		fetchClient: typeof window === 'object' ? fetch.bind(window) : fetch,
		isSilent: false,
		logger: undefined,
		payload: 'json',
		validate: undefined,
	};

	/**
	 * Constructor for FetchConfigLoader
	 * @param request - callback that returns a fetch request or a message object that the request is not ready
	 * @param options - optional options for FetchConfigLoader
	 * @param type - optional name type for FetchConfigLoader (default: 'fetch')
	 */
	constructor(request: FetchConfigRequest, options: Loadable<Partial<FetchConfigLoaderOptions>> = {}, type: Lowercase<string> = 'fetch') {
		super(options);
		this.request = request;
		this.type = type;
	}

	protected async handleLoader(lookupKey: string, overrideKey: string | undefined): Promise<LoaderValue> {
		// check if we have JSON data loaded, if not load it
		if (!this.dataPromise || !this._isLoaded) {
			this.dataPromise = this.handleData();
		}
		const data = await this.dataPromise;
		const targetKey = overrideKey || lookupKey; // optional override key, else use actual lookupKey
		const value = data[targetKey] || undefined;
		return {type: this.type, result: {value, path: this.path, seen: this.handleSeen(targetKey, value)}};
	}

	protected async handleData(): Promise<Record<string, string | undefined>> {
		const {logger, cache, isSilent, cacheHitHttpCode, payload} = await this.getOptions();
		this._isLoaded = false;
		const req = await this.getRequest();
		if (isRequestNotReadMessage(req)) {
			logger?.debug(`FetchEnvConfig: ${req.message}`);
			return Promise.resolve({});
		}
		this.path = urlSanitize(req.url); // hide username/passwords from URL in logs
		logger?.debug(`fetching config from ${this.path}`);
		let res = await this.fetchRequestOrCacheResponse(req);
		if (!res) {
			logger?.info(`client is offline and not have cached response for FetchEnvConfig`);
			return Promise.resolve({});
		}
		// if we have a cache and valid response, store to cache
		if (res.ok && cache) {
			logger?.debug(`storing response in cache for FetchEnvConfig`);
			await cache.storeRequest(req, res);
		}
		if (res.status >= 400) {
			// if we have an error and a cached response, use that instead
			res = await this.checkIfValidCacheResponse(req, res);
			// if we still have an error, throw it
			if (res.status >= 400) {
				if (isSilent) {
					logger?.info(`http error ${res.status.toString()} from FetchEnvConfig`);
					return Promise.resolve({}); // set as empty so we prevent fetch spamming
				}
				throw new VariableError(`http error ${res.status.toString()} from FetchEnvConfig`);
			}
		}
		// if we have a cached response and we get a cache hit code (default 304), use the cached response instead
		if (res.status === cacheHitHttpCode) {
			res = await this.handleNotModifiedCache(req, res);
		}
		const contentType = res.headers.get('content-type');
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (contentType?.startsWith('application/json') && payload === 'json') {
			const data = await this.handleJson(res);
			logger?.debug('successfully loaded config from FetchEnvConfig');
			this._isLoaded = true;
			return data;
		}
		if (isSilent) {
			logger?.info(`unsupported content-type ${String(contentType)} from FetchEnvConfig`);
			return Promise.resolve({}); // set as empty so we prevent fetch spamming
		}
		throw new VariableError(`unsupported content-type ${String(contentType)} from FetchEnvConfig`);
	}

	/**
	 * if client is offline, we will try return the cached response else add cache validation (ETag) and try get the response from the fetch request
	 */
	private async fetchRequestOrCacheResponse(req: Request): Promise<Response | undefined> {
		const {logger, cache, fetchClient} = await this.getOptions();
		if (cache) {
			const cacheRes = await cache.fetchRequest(req);
			// if we have a cache and we are offline, use the cache else return undefined
			if (!cache.isOnline()) {
				if (cacheRes) {
					logger?.debug(`client is offline, returned cached response for FetchEnvConfig`);
					return cacheRes;
				}
				return undefined;
			}
			// take ETag from last cache response and add to request headers as If-None-Match for automatic cache validation (if service supports it).
			if (cacheRes) {
				const etag = cacheRes.headers.get('etag');
				if (etag) {
					req.headers.set('If-None-Match', etag);
				}
			}
		}
		return fetchClient(req);
	}

	/**
	 * on error, check if we have a valid cached response
	 */
	private async checkIfValidCacheResponse(req: Request, res: Response): Promise<Response> {
		const {cache} = await this.getOptions();
		if (cache) {
			const cacheRes = await cache.fetchRequest(req);
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
		const {cache, logger} = await this.getOptions();
		if (cache) {
			const cacheRes = await cache.fetchRequest(req);
			if (cacheRes) {
				logger?.debug(`returned cached response for FetchEnvConfig`);
				return cacheRes;
			}
			throw new VariableError(`http error ${res.status.toString()} from FetchEnvConfig (using cached version)`); // we have a cache but no cached response
		}
		return res;
	}

	private async handleJson(res: Response): Promise<Record<string, string | undefined>> {
		const {validate, isSilent, logger} = await this.getOptions();
		try {
			const contentType = res.headers.get('content-type');
			if (!contentType?.startsWith('application/json')) {
				throw new Error(`unsupported content-type ${String(contentType)}`);
			}
			const rawData: unknown = await res.json();
			if (!isValidObject(rawData)) {
				throw new Error(`is not valid JSON object`);
			}
			const data = buildStringObject(rawData);
			if (validate) {
				return await validate(data);
			}
			return data;
		} catch (error) {
			const err = error instanceof Error ? error : new Error('unknown error');
			if (isSilent) {
				logger?.info(`FetchEnvConfig JSON error: ${err.message}`);
				return Promise.resolve({}); // set as empty so we prevent fetch spamming
			}
			throw new VariableError(`FetchEnvConfig JSON error: ${err.message}`);
		}
	}

	private async getRequest(): Promise<ConfigRequest> {
		return typeof this.request === 'function' ? this.request() : this.request;
	}
}
