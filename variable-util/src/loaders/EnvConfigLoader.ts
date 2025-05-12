import {type OverrideKeyMap} from '../interfaces';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

/**
 * env loader class is used to load env variables from process.env
 * @template OverrideMap - the type of the override key map
 * @param {string} [overrideKey] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 * @since v1.0.0
 */
export class EnvConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<IConfigLoaderProps, OverrideMap> {
	public readonly loaderType = 'env';
	public override defaultOptions: IConfigLoaderProps = {
		disabled: false,
	};

	protected handleLoaderValue(lookupKey: string) {
		return {value: process.env[lookupKey], path: `process.env.${lookupKey}`};
	}
}
