import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import {type Loadable} from '@luolapeikko/ts-common';
import {type ConfigOptions} from './ConfigOptions';
import {getConfigVariable} from './getConfigVariable';
import {type IConfigLoader, type IConfigParser} from './interfaces';
import {type FormatParameters} from './lib/formatUtils';

/**
 * get config variable from loaders
 * @example
 * // from "@avanio/variable-util-node"
 * const portResult: Result<string> = await getConfigVariableResult('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 *
 * const value: string = portResult.unwrap(); //  get value or throw error
 * const value: string | undefined = portResult.ok(); //  get value or undefined
 * @param {string} rootKey - root key of config variable
 * @param {IConfigLoader[]} loaders - loaders to use
 * @param {IConfigParser<unknown, Output>} parser - parser to use
 * @param {Loadable<Output>} [defaultValueLoadable] - default value to use
 * @param {FormatParameters} [params] - optional format parameters
 * @param {ConfigOptions} [options] - optional config options
 * @returns {Promise<IResult<Output | undefined>>} - result with value or error
 * @since v1.0.0
 */
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<Output>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<Output | undefined>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<unknown, Output>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<Output | undefined>> {
	try {
		return Ok(await getConfigVariable(rootKey, loaders, parser, defaultValueLoadable, params, options));
	} catch (err) {
		return Err(err);
	}
}
