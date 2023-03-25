import {IConfigLoader} from '../interfaces/IConfigLoader';

export function reactEnv(overrideKey?: string | undefined): IConfigLoader {
	return {
		type: 'react-env',
		callback: (lookupKey) => {
			const targetKey = `REACT_APP_${overrideKey || lookupKey}`;
			return Promise.resolve({key: lookupKey, value: process.env[targetKey], path: `process.env.${targetKey}`});
		},
	};
}
