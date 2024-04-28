import {IConfigLoader, LoaderValue} from '../interfaces/IConfigLoader';
import {handleSeen} from '../lib/seenUtils';

const seenMap = new Map<string, string>();

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
			const currentValue = process.env[targetKey];
			return {type: 'react-env', result: {value: currentValue, path: `process.env.${targetKey}`, seen: handleSeen(seenMap, targetKey, currentValue)}};
		},
	};
}
