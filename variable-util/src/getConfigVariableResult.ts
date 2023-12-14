import {Err, Ok, Result} from '@luolapeikko/result-option';
import {IConfigLoader, IConfigParser} from './interfaces';
import {FormatParameters} from './lib/formatUtils';
import {getConfigVariable} from './getConfigVariable';
import {Loadable} from './types/Loadable';

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
): Promise<Result<Output>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<Result<Output | undefined>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<Result<Output | undefined>> {
	try {
		return Ok(await getConfigVariable(rootKey, loaders, parser, defaultValueLoadable, params));
	} catch (err) {
		return Err(err);
	}
}
