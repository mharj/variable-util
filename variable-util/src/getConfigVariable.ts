import {type Loadable} from '@luolapeikko/ts-common';
import {type ConfigOptions} from './ConfigOptions';
import {getConfigObject} from './getConfigObject';
import {type EncodeOptions, type IConfigLoader, type IConfigParser} from './interfaces';
import {type FormatParameters} from './lib/formatUtils';

/**
 * get config variable from loaders
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 *
 * const port: Promise<string> = await getConfigVariable('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * // with override key
 * const port: Promise<string> = await getConfigVariable('PORT', [env('HTTP_PORT', fileEnv())], stringParser, '8080', {showValue: true});
 * @param {string} rootKey - root key of config variable
 * @param {IConfigLoader[]} loaders - loaders to use
 * @param {IConfigParser<unknown, Output>} parser - parser to use
 * @param {Loadable<Output>} [defaultValueLoadable] - default value to use
 * @param {FormatParameters} [params] - optional format parameters
 * @param {ConfigOptions} [options] - optional config options
 * @param {EncodeOptions} [encodeOptions] - optional encode options
 * @returns {Promise<Output>} - config variable
 * @since v0.2.5
 */
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<Output>;
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<Output | undefined>;
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
	encodeOptions?: EncodeOptions,
): Promise<Output | undefined> {
	return (await getConfigObject(rootKey, loaders, parser, defaultValueLoadable, params, options, encodeOptions)).value;
}
