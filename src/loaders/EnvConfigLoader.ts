import {IConfigLoader} from '../interfaces/IConfigLoader';

export function env(overrideKey?: string | undefined): IConfigLoader {
	return {
		type: 'env',
		callback: (lookupKey) => {
			const targetKey = overrideKey || lookupKey;
			return Promise.resolve({key: lookupKey, value: process.env[targetKey], path: `process.env.${targetKey}`});
		},
	};
}
