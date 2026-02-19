/// <reference types="vite/client" />
import {ConfigLoader, type IConfigLoaderProps, type LoaderValue, type OverrideKeyMap} from '@avanio/variable-util';

/**
 * Vite env loader class is used to load env variables from import.meta.env.VITE_*
 * @example
 * const viteEnv = new ViteEnvConfigLoader();
 * const loaders = [viteEnv, fetchEnv];
 * export const envConfig = new ConfigMap<EnvConfig>({
 *   API_HOST: {loaders, parser: urlParser, defaultValue: new URL('http://localhost:3001'), params: {showValue: true}},
 * });
 * @template OverrideMap - the type of the override key map
 * @param {Partial<OverrideMap>} [override] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 * @since v1.0.0
 */
export class ViteEnvConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<IConfigLoaderProps, OverrideMap> {
	public readonly loaderType = 'vite-env';
	public override defaultOptions: IConfigLoaderProps = {
		disabled: false,
	};

	protected handleLoaderValue(lookupKey: string): undefined | LoaderValue {
		const targetKey = `VITE_${lookupKey}`;
		const currentValue: unknown = import.meta.env[targetKey];
		if (typeof currentValue === 'string' || typeof currentValue === 'number' || typeof currentValue === 'boolean') {
			return {path: `import.meta.env.${targetKey}`, value: String(currentValue)};
		} else {
			return undefined;
		}
	}
}
