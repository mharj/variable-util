import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import {type IConfigLoader, type IConfigParser} from './interfaces';
import {type ConfigOptions} from './ConfigOptions';
import {type FormatParameters} from './lib/formatUtils';
import {getConfigObject} from './getConfigObject';
import {type Loadable} from './types/Loadable';

/**
 * Wrapper around getConfigObject that returns a Result
 * @param rootKey root key of config object
 * @param loaders array of loaders
 * @param parser parser for value
 * @param defaultValueLoadable optional default value
 * @param params optional format parameters
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 * const portConfig: Result<{type: string | undefined; value: string}> = await getConfigObject('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * if ( portConfig.isOk() ) {
 *   const {value, type} = portConfig.unwrap();
 * } else {
 *   // handle error
 * }
 */
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<{type: string | undefined; value: Output}>>;
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<{type: string | undefined; value: Output | undefined}>>;
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<{type: string | undefined; value: Output | undefined}>> {
	try {
		return Ok(await getConfigObject(rootKey, loaders, parser, defaultValueLoadable, params, options));
	} catch (err) {
		return Err(err);
	}
}
