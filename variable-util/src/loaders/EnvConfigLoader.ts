import {IConfigLoader, LoaderValue} from '../interfaces/IConfigLoader';

export function env(overrideKey?: string | undefined): IConfigLoader {
	return {
		type: 'env',
		callback: async (lookupKey): Promise<LoaderValue> => {
			const targetKey = overrideKey || lookupKey;
			return {type: 'env', value: process.env[targetKey], path: `process.env.${targetKey}`};
		},
	};
}
