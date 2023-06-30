import {Err, Ok, Result} from 'mharj-result';
import {IConfigLoader, IConfigParser} from './interfaces';
import {FormatParameters} from './lib/formatUtils';
import {getConfigObject} from './getConfigObject';
import {Loadable} from './types/Loadable';

export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
): Promise<Result<{type: string | undefined; value: Output}>>;
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<Result<{type: string | undefined; value: Output | undefined}>>;
export async function getConfigObjectResult<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<Result<{type: string | undefined; value: Output | undefined}>> {
	try {
		return Ok(await getConfigObject(rootKey, loaders, parser, defaultValueLoadable, params));
	} catch (err) {
		return Err(err);
	}
}
