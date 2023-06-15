import {handleLoader, printLog} from './loaderUtils';
import {IConfigLoader, IConfigParser} from './interfaces/';
import {FormatParameters} from './lib/formatUtils';
import {getLogger} from './logger';
import {Loadable} from './types/Loadable';
import {VariableError} from './VariableError';

export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
): Promise<{type: string | undefined; value: Output}>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<{type: string | undefined; value: Output | undefined}>;
export async function getConfigObject<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<{type: string | undefined; value: Output | undefined}> {
	let defaultValue: Output | undefined;
	let type: string | undefined;
	const logger = getLogger();
	/**
	 * get default value before loaders (to throw error before loaders)
	 */
	if (defaultValueLoadable) {
		try {
			const value = await (typeof defaultValueLoadable === 'function' ? defaultValueLoadable() : defaultValueLoadable);
			if (!value) {
				throw new VariableError('default value is empty');
			}
			defaultValue = value;
			type = 'default';
		} catch (err) {
			logger?.error(err);
			throw err;
		}
	}
	for (const loader of loaders) {
		let output: {type: string; value: Output | undefined} | undefined;
		try {
			output = await handleLoader(rootKey, loader, parser, params);
		} catch (err) {
			logger?.error(err);
		}
		if (output !== undefined) {
			return output;
		}
	}
	if (defaultValue) {
		printLog(logger, 'default', rootKey, parser.toString(defaultValue), 'default', params);
	}
	return {type, value: defaultValue};
}
