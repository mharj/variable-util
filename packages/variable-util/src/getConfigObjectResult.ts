import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import type {Loadable} from '@luolapeikko/ts-common';
import type {ConfigOptions} from './ConfigOptions';
import {getConfigObject} from './getConfigObject';
import type {IConfigLoader, IConfigParser} from './interfaces';
import type {FormatParameters} from './lib/formatUtils';

/**
 * Wrapper around getConfigObject that returns a Result
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 * const portConfig: Result<{type: string | undefined; value: string}> = await getConfigObject('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * if ( portConfig.isOk() ) {
 *   const {value, type} = portConfig.unwrap();
 * } else {
 *   // handle error
 * }
 * @template Output - Type of output
 * @param {string} rootKey root key of config object
 * @param {IConfigLoader[]} loaders array of loaders
 * @param {IConfigParser<unknown, Output>} parser parser for value
 * @param {Loadable<Output>} defaultValueLoadable optional default value
 * @param {FormatParameters} params optional format parameters
 * @param {ConfigOptions} options optional config options
 * @returns {Promise<IResult<{type: string | undefined; value: Output}>>} result
 * @since v0.2.5
 */
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<{type: string | undefined; value: Output}>>;
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<{type: string | undefined; value: Output | undefined}>>;
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
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
