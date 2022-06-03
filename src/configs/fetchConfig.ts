import {Config, GetValue} from '../config';

export class FetchJsonEnvConfig extends Config {
	public type = 'fetch';
	private requestCallback: () => Promise<Request>;
	private fetchClient: typeof fetch;
	private data: Record<string, string> | undefined;
	private path = 'undefined';

	constructor(requestCallback: () => Promise<Request>, fetchClient?: typeof fetch) {
		super();
		this.requestCallback = requestCallback;
		this.fetchClient = fetchClient || fetch;
	}

	public async get(key: string): Promise<GetValue> {
		if (!this.data) {
			this.data = await this.fetchData();
		}
		return Promise.resolve({value: this.data?.[key], path: this.path});
	}

	private async fetchData() {
		const req = await this.requestCallback();
		this.path = req.url;
		const res = await this.fetchClient(req);
		if (res.status >= 400) {
			throw new Error(`http error ${res.status} from FetchEnvConfig`);
		}
		return res.json();
	}
}
