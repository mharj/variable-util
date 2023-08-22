import {IConfigLoader, LoaderValue} from '../interfaces/IConfigLoader';

/**
 * React env loader function is used to load env variables from process.env.REACT_APP_*
 * @param {string} [overrideKey] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 */
export function reactEnv(overrideKey?: string | undefined): IConfigLoader {
	return {
		type: 'react-env',
		callback: async (lookupKey): Promise<LoaderValue> => {
			const targetKey = `REACT_APP_${overrideKey || lookupKey}`;
			return {type: 'react-env', result: {value: process.env[targetKey], path: `process.env.${targetKey}`}};
		},
	};
}
