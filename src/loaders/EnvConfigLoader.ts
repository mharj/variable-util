import {ConfigLoader, GetValue} from '.';

export class EnvConfigLoader extends ConfigLoader {
	public type = 'env';
	public get(key: string): Promise<GetValue> {
		return Promise.resolve({value: process.env[key], path: `process.env.${key}`});
	}
}
