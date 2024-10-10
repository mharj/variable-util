import {type IConfigLoader, type LoaderValue} from '../interfaces/IConfigLoader';
import {handleSeen} from '../lib/seenUtils';

const seenMap = new Map<string, string>();

/**
 * env loader function is used to load env variables from process.env
 * @param {string} [overrideKey] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 * @since v0.5.0
 */
export function env(overrideKey?: string): IConfigLoader {
	return {
		type: 'env',
		callback: (lookupKey): LoaderValue => {
			const targetKey = overrideKey || lookupKey;
			const currentValue = process.env[targetKey];
			return {type: 'env', result: {value: currentValue, path: `process.env.${targetKey}`, seen: handleSeen(seenMap, targetKey, currentValue)}};
		},
	};
}
