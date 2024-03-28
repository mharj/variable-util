import {IConfigLoader, IConfigParser} from './interfaces/';
import {ConfigOptions} from './ConfigOptions';
import {FormatParameters} from './lib/formatUtils';
import {getConfigObject} from './getConfigObject';
import {Loadable} from './types/Loadable';

/**
 * get config variable from loaders
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 *
 * const port: Promise<string> = await getConfigVariable('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * // with override key
 * const port: Promise<string> = await getConfigVariable('PORT', [env('HTTP_PORT', fileEnv())], stringParser, '8080', {showValue: true});
 */
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<Output>;
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<Output | undefined>;
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<Output | undefined> {
	return (await getConfigObject(rootKey, loaders, parser, defaultValueLoadable, params, options))?.value;
}
