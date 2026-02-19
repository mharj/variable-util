import type {ILoggerLike} from '@avanio/logger-like';
import type {Loadable} from '@luolapeikko/ts-common';
import type {OverrideKeyMap} from '../interfaces/IConfigLoader';
import type {IRequestCache} from '../interfaces/IRequestCache';
import type {ValidateCallback} from '../interfaces/IValidate';
import {applyStringMap, buildStringObject, isValidObject} from '../lib';
import {urlSanitize} from '../lib/formatUtils';
import {isRequestNotReadMessage, type RequestNotReady} from '../types/RequestNotReady';
import {VariableError} from '../VariableError';
import type {IConfigLoaderProps, LoaderValue} from './ConfigLoader';
import {MapConfigLoader} from './MapConfigLoader';

/**
 * Options for the FetchConfigLoader
 * @since v1.0.0
 */
export interface FetchConfigLoaderOptions extends IConfigLoaderProps {
	fetchClient: typeof fetch;
	/** this prevents Error to be thrown if have http error */
	isSilent: boolean;
	payload: 'json';
	validate: ValidateCallback<Record<string, string | undefined>, Record<string, string | undefined>> | undefined;
	logger: ILoggerLike | undefined;
	cache: IRequestCache | undefined;
	/** if we get a cache hit code (defaults 304), we use the cached response instead */
	cacheHitHttpCode: number;
}

export type ConfigRequest = Request | RequestNotReady;

/**
 * FetchConfigLoader is used to load config from a fetch request
 * @template OverrideMap - the type of the override key map
 * @category Loaders
 * @since v1.0.0
 */
export class FetchConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends MapConfigLoader<FetchConfigLoaderOptions, OverrideMap> {
	public readonly loaderType: Lowercase<string>;
	private request: Loadable<ConfigRequest>;
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
	 * @param {Loadable<ConfigRequest>} request - callback that returns a fetch request or a message object that the request is not ready
	 * @param {Loadable<Partial<FetchConfigLoaderOptions>>} options - optional options for FetchConfigLoader
	 * @param {Partial<OverrideMap>} overrideKeys - optional override keys for FetchConfigLoader
	 * @param {Lowercase<string>} type - optional name type for FetchConfigLoader (default: 'fetch')
	 */
	public constructor(
		request: Loadable<ConfigRequest>,
		options: Loadable<Partial<FetchConfigLoaderOptions>> = {},
		overrideKeys: Partial<OverrideMap> = {},
		type: Lowercase<string> = 'fetch',
	) {
		super(options, overrideKeys);
		this.request = request;
		this.loaderType = type;
	}

	protected async handleLoaderValue(lookupKey: string): Promise<undefined | LoaderValue> {
		// check if we have JSON data loaded, if not load it
		if (!this._isLoaded) {
			await this.loadData();
			this._isLoaded = true; // only load data once to prevent spamming fetch requests (use reload method to manually update data)
		}
		return {path: this.path, value: this.data.get(lookupKey)};
	}

	protected async handleLoadData(): Promise<boolean> {
		const {logger, cache, isSilent, cacheHitHttpCode, payload} = await this.getOptions();
		const req = await this.getRequest();
		if (isRequestNotReadMessage(req)) {
			logger?.debug(`FetchEnvConfig: ${req.message}`);
			return false;
		}
		this.path = urlSanitize(req.url); // hide username/passwords from URL in logs
		logger?.debug(`fetching config from ${this.path}`);
		let res = await this.fetchRequestOrCacheResponse(req);
		if (!res) {
			logger?.info(`client is offline and not have cached response for FetchEnvConfig`);
			return false;
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
					return false;
				}
				throw new VariableError(`http error ${res.status.toString()} from FetchEnvConfig`);
			}
		}
		// if we have a cached response and we get a cache hit code (default 304), use the cached response instead
		if (res.status === cacheHitHttpCode) {
			res = await this.handleNotModifiedCache(req, res);
		}
		const contentType = res.headers.get('content-type');
		if (contentType?.startsWith('application/json') && payload === 'json') {
			applyStringMap(await this.handleJson(res), this.data);
			logger?.debug('successfully loaded config from FetchEnvConfig');
			return true;
		}
		if (isSilent) {
			logger?.info(`unsupported content-type ${String(contentType)} from FetchEnvConfig`);
			return false;
		}
		throw new VariableError(`unsupported content-type ${String(contentType)} from FetchEnvConfig`);
	}

	/**
	 * if client is offline, we will try return the cached response else add cache validation (ETag) and try get the response from the fetch request
	 * @param {Request} req - request to fetch
	 * @returns {Promise<Response | undefined>} - response or undefined
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
	 * @param {Request} req - request to fetch
	 * @param {Response} res - response from fetch
	 * @returns {Promise<Response>} - response
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
	 * @param {Request} req - request to fetch
	 * @param {Response} res - response from fetch
	 * @returns {Promise<Response>} - response
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
		return await (typeof this.request === 'function' ? this.request() : this.request);
	}
}
