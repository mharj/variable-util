import {IConfigLoader, LoaderValue} from '../interfaces/IConfigLoader';

/**
 * env loader function is used to load env variables from process.env
 * @param {string} [overrideKey] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 */
export function env(overrideKey?: string | undefined): IConfigLoader {
	return {
		type: 'env',
		callback: async (lookupKey): Promise<LoaderValue> => {
			const targetKey = overrideKey || lookupKey;
			return {type: 'env', result: {value: process.env[targetKey], path: `process.env.${targetKey}`}};
		},
	};
}
