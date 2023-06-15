import {Err, IResult, Ok} from 'mharj-result';
import {IConfigLoader, IConfigParser} from './interfaces';
import {FormatParameters} from './lib/formatUtils';
import {getConfigVariable} from './getConfigVariable';
import {Loadable} from './types/Loadable';

/**
 * @example
 * // from "@avanio/variable-util-node"
 * const port: Promise<IResult<string>> = await getConfigVariableResult('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 *
 * const value: string = port.unwrap(); //  get value or throw error
 * const value: string | undefined = port.ok(); //  get value or undefined
 */
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
): Promise<IResult<Output>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<IResult<Output | undefined>>;
export async function getConfigVariableResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<IResult<Output | undefined>> {
	try {
		return new Ok(await getConfigVariable(rootKey, loaders, parser, defaultValueLoadable, params));
	} catch (err) {
		return new Err(err);
	}
}