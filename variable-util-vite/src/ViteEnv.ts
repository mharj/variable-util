/// <reference types="vite/client" />
import {handleSeen, type IConfigLoader, type LoaderValue} from '@avanio/variable-util';

const seenMap = new Map<string, string>();

/**
 * import meta env loader function is used to load env variables from import.meta.env
 * @param {string} [overrideKey] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 * @since v0.13.0
 */
export function viteEnv(overrideKey?: string): IConfigLoader {
	return {
		type: 'vite-env',
		callback: (lookupKey): LoaderValue => {
			const targetKey = `VITE_${overrideKey ?? lookupKey}`;
			const currentValue: unknown = import.meta.env[targetKey];
			if (typeof currentValue === 'string' || typeof currentValue === 'number' || typeof currentValue === 'boolean') {
				const value = String(currentValue);
				return {type: 'vite-env', result: {value, path: `import.meta.env.${targetKey}`, seen: handleSeen(seenMap, targetKey, value)}};
			} else {
				return {type: 'vite-env', result: undefined};
			}
		},
	};
}
