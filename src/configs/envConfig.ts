import {Config, GetValue} from '../config';

export class EnvConfig extends Config {
	public type = 'env';
	public get(key: string): Promise<GetValue> {
		return Promise.resolve({value: process.env[key], path: `process.env.${key}`});
	}
}
