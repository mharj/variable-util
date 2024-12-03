import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import {type IConfigLoader, type IConfigParser} from './interfaces';
import {type ConfigOptions} from './ConfigOptions';
import {type FormatParameters} from './lib/formatUtils';
import {getConfigVariable} from './getConfigVariable';
import {type Loadable} from '@luolapeikko/ts-common';

/**
 * @example
 * // from "@avanio/variable-util-node"
 * const portResult: Result<string> = await getConfigVariableResult('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 *
 * const value: string = portResult.unwrap(); //  get value or throw error
 * const value: string | undefined = portResult.ok(); //  get value or undefined
 */
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<Output>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output>,
	params?: FormatParameters,
	options?: ConfigOptions,
): Promise<IResult<Output | undefined>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
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
