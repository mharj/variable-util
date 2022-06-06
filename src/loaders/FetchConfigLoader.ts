import {ConfigLoader, GetValue} from '.';
import {urlSanitize} from '../formatUtils';

interface FetchConfigLoaderOptions {
	fetchClient: typeof fetch;
	/** this prevents Error to be thrown if have http error */
	isSilent: boolean;
	payload: 'json';
}

const defaultOptions: FetchConfigLoaderOptions = {
	fetchClient: fetch,
	isSilent: false,
	payload: 'json',
};

export class FetchConfigLoader extends ConfigLoader {
	public type = 'fetch';
	private requestCallback: () => Promise<Request>;
	private dataPromise: Promise<Record<string, string>> | undefined;
	private path = 'undefined';
	private options: FetchConfigLoaderOptions;

	constructor(requestCallback: () => Promise<Request>, _options: Partial<FetchConfigLoaderOptions> = {}) {
		super();
		this.options = {...defaultOptions, ..._options};
		this.requestCallback = requestCallback;
	}

	public async reload(): Promise<void> {
		this.dataPromise = this.fetchData();
		await this.dataPromise;
	}

	public isLoaded(): boolean {
		return this.dataPromise !== undefined;
	}

	public async get(key: string): Promise<GetValue> {
		if (!this.dataPromise) {
			this.dataPromise = this.fetchData();
		}
		const data = await this.dataPromise;
		return Promise.resolve({value: data?.[key], path: this.path});
	}

	private async fetchData() {
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
			return this.handleJson(res);
		}
		throw new Error(`unsupported content-type ${contentType} from FetchEnvConfig`);
	}

	private handleJson(res: Response) {
		return res.json();
	}
}
