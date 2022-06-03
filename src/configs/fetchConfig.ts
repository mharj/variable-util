import {Config, GetValue} from '../config';

export class FetchJsonEnvConfig extends Config {
	public type = 'fetch';
	private req: Request;
	private data: Record<string, string> | undefined;

	constructor(input: RequestInfo) {
		super();
		this.req = new Request(input);
	}

	public async get(key: string): Promise<GetValue> {
		if (!this.data) {
			this.data = await this.fetchData();
		}
		return Promise.resolve({value: this.data?.[key], path: this.req.url});
	}

	private async fetchData() {
		const res = await fetch(this.req);
		if (res.status >= 400) {
			throw new Error(`http error ${res.status} from FetchEnvConfig`);
		}
		return res.json();
	}
}
