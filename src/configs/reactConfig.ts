import {Config, GetValue} from '../config';

export class ReactEnvConfig extends Config {
	public type = 'react_env';
	public get(key: string): Promise<GetValue> {
		return Promise.resolve({value: process.env[`REACT_APP_${key}`], path: `process.env.REACT_APP_${key}`});
	}
}
