/* eslint-disable @typescript-eslint/await-thenable */
import {type Loadable, LoadableCore} from '@luolapeikko/ts-common';
import {buildOptions, type ConfigOptions} from './ConfigOptions';
import type {EncodeOptions, IConfigLoader, IConfigParser} from './interfaces';
import type {FormatParameters} from './lib/formatUtils';
import {handleSeen} from './lib/seenUtils';
import {handleAsVariableError, handleLoader, printLog} from './loaderUtils';
import type {LoaderTypeValue, LoaderTypeValueStrict} from './types/TypeValue';

/**
 * Map of seen default values
 */
const defaultValueSeenMap = new Map<string, string>();

/**
 * Clear the seen map for default values (for unit testing purposes)
 * @since v0.2.5
 */
export function clearDefaultValueSeenMap(): void {
	defaultValueSeenMap.clear();
}

/**
 * get config object which contains value and type of loader
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 * const portConfig: {type: string | undefined; value: string} = await getConfigObject('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * const value: string = portConfig.value;
 * const type: string | undefined = portConfig.type; // loader type name
 * @template Output - Type of output
 * @param {string} rootKey root key of config object
 * @param {IConfigLoader[]} loaders array of loaders
 * @param {IConfigParser<unknown, Output>} parser parser for value
 * @param {Loadable<Output>} defaultValueLoadable optional default value
 * @param {FormatParameters} params optional format parameters
 * @param {ConfigOptions} options optional config options
 * @param {EncodeOptions} [encodeOptions] optional encode options
 * @returns {Promise<LoaderTypeValue<Output>>} config object
 * @since v0.2.5
 */
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<LoaderTypeValueStrict<Output>>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<LoaderTypeValue<Output>>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
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
			defaultValue = (await LoadableCore.resolve(defaultValueLoadable)) as Output;
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
