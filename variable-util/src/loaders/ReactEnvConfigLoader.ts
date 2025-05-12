import {type OverrideKeyMap} from '../interfaces/IConfigLoader';
import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';

/**
 * React env loader class is used to load env variables from process.env.REACT_APP_*
 * @template OverrideMap - the type of the override key map
 * @param {Partial<OverrideMap>} [override] - optional override key for lookup
 * @returns {IConfigLoader} - IConfigLoader object
 * @category Loaders
 * @since v1.0.0
 */
export class ReactEnvConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends ConfigLoader<IConfigLoaderProps, OverrideMap> {
	public readonly loaderType = 'react-env';
	public override defaultOptions: IConfigLoaderProps = {
		disabled: false,
	};

	protected handleLoaderValue(lookupKey: string) {
		const targetKey = `REACT_APP_${lookupKey}`;
		return {value: process.env[targetKey], path: `process.env.${targetKey}`};
	}
}
