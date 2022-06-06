import {ConfigLoader, GetValue} from '.';

export class ReactEnvConfigLoader extends ConfigLoader {
	public type = 'react_env';
	public get(key: string): Promise<GetValue> {
		return Promise.resolve({value: process.env[`REACT_APP_${key}`], path: `process.env.REACT_APP_${key}`});
	}
}
