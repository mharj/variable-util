/* eslint-disable @typescript-eslint/await-thenable */
import {buildOptions, type ConfigOptions} from './ConfigOptions';
import {type EncodeOptions, type IConfigLoader, type IConfigParser} from './interfaces/';
import {handleAsVariableError, handleLoader, printLog} from './loaderUtils';
import {type Loadable, resolveLoadable} from '@luolapeikko/ts-common';
import {type LoaderTypeValue, type LoaderTypeValueStrict} from './types/TypeValue';
import {type FormatParameters} from './lib/formatUtils';
import {handleSeen} from './lib/seenUtils';

/**
 * Map of seen default values
 */
const defaultValueSeenMap = new Map<string, string>();

/**
 * Clear the seen map for default values (for unit testing purposes)
 */
export function clearDefaultValueSeenMap(): void {
	defaultValueSeenMap.clear();
}

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
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<LoaderTypeValueStrict<Output>>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<LoaderTypeValue<Output>>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<LoaderTypeValue<Output>> {
	const currentOptions = buildOptions(options);
	let defaultValue: Output | undefined;
	let type: string | undefined;
	/**
	 * get default value before loaders (to throw error before loaders)
	 */
	if (defaultValueLoadable !== undefined) {
		try {
			defaultValue = (await resolveLoadable(defaultValueLoadable)) as Output;
			type = 'default';
		} catch (err) {
			currentOptions.logger?.error(err);
			throw handleAsVariableError(err);
		}
	}
	for (const loader of loaders) {
		let output: LoaderTypeValue<Output> | undefined;
		try {
			output = await handleLoader(rootKey, loader, parser, params, currentOptions, encodeOptions);
		} catch (err) {
			currentOptions.logger?.error(err);
		}
		if (output !== undefined) {
			return output;
		}
	}
	let stringValue: string | undefined;
	if (defaultValue !== undefined) {
		stringValue = parser.toString(defaultValue, encodeOptions);
		if (!handleSeen(defaultValueSeenMap, rootKey, stringValue) && !encodeOptions?.silent) {
			printLog(currentOptions, 'default', rootKey, stringValue, 'default', params);
		}
		return {namespace: currentOptions.namespace, stringValue, type: 'default', value: defaultValue};
	}
	return {namespace: currentOptions.namespace, stringValue, type, value: defaultValue};
}
