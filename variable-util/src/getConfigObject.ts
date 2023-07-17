import {handleLoader, printLog} from './loaderUtils';
import {IConfigLoader, IConfigParser} from './interfaces/';
import {FormatParameters} from './lib/formatUtils';
import {getLogger} from './logger';
import {Loadable} from './types/Loadable';
import {VariableError} from './VariableError';

/**
 * get config object which contains value and type of loader
 * @param rootKey root key of config object
 * @param loaders array of loaders
 * @param parser parser for value
 * @param defaultValueLoadable optional default value
 * @param params optional format parameters
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 * const portConfig: {type: string | undefined; value: string} = await getConfigObject('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * const value: string = portConfig.value;
 * const type: string | undefined = portConfig.type; // loader type name
 */
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
): Promise<{type: string | undefined; value: Output; stringValue: string | undefined}>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<{type: string | undefined; value: Output | undefined; stringValue: string | undefined}>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<{type: string | undefined; value: Output | undefined; stringValue: string | undefined}> {
	let defaultValue: Output | undefined;
	let type: string | undefined;
	const logger = getLogger();
	/**
	 * get default value before loaders (to throw error before loaders)
	 */
	if (defaultValueLoadable) {
		try {
			const value = await (typeof defaultValueLoadable === 'function' ? defaultValueLoadable() : defaultValueLoadable);
			if (!value) {
				throw new VariableError('default value is empty');
			}
			defaultValue = value;
			type = 'default';
		} catch (err) {
			logger?.error(err);
			throw err;
		}
	}
	for (const loader of loaders) {
		let output: {type: string; value: Output | undefined; stringValue: string | undefined} | undefined;
		try {
			output = await handleLoader(rootKey, loader, parser, params);
		} catch (err) {
			logger?.error(err);
		}
		if (output !== undefined) {
			return output;
		}
	}
	let stringValue: string | undefined;
	if (defaultValue) {
		stringValue = parser.toString(defaultValue);
		printLog(logger, 'default', rootKey, stringValue, 'default', params);
	}
	return {type, value: defaultValue, stringValue};
}
