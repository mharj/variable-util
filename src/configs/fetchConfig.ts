import {Config, GetValue} from '../config';

interface FetchJsonEnvConfigOptions {
	fetchClient?: typeof fetch;
	/** this prevents Error to be thrown if have http error */
	isSilent?: boolean;
}

export class FetchJsonEnvConfig extends Config {
	public type = 'fetch';
	private requestCallback: () => Promise<Request>;
	private fetchClient: typeof fetch;
	private dataPromise: Promise<Record<string, string>> | undefined;
	private path = 'undefined';
	private isSilent: boolean;

	constructor(requestCallback: () => Promise<Request>, {fetchClient, isSilent}: FetchJsonEnvConfigOptions) {
		super();
		this.requestCallback = requestCallback;
		this.fetchClient = fetchClient || fetch;
		this.isSilent = isSilent || false;
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
		this.path = req.url;
		const res = await this.fetchClient(req);
		if (res.status >= 400) {
			if (this.isSilent) {
				return Promise.resolve({}); // set as empty so we prevent fetch spamming
			}
			throw new Error(`http error ${res.status} from FetchEnvConfig`);
		}
		return res.json();
	}
}
