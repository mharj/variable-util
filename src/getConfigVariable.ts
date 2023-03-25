import {FormatParameters, printValue} from './lib/formatUtils';
import {ILoggerLike, IConfigParser, IConfigLoader} from './interfaces/';

let logger: ILoggerLike | undefined;
export function setLogger(newLogger: ILoggerLike) {
	logger = newLogger;
}

/**
 * @example
 * const port = await getConfigVariable('PORT', [env()], '8080', {showValue: true});
 */
export async function getConfigVariable<Out>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Out>,
	defaultValue: string,
	params?: FormatParameters,
): Promise<Out>;
export async function getConfigVariable<Out>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Out>,
	defaultValue?: Out | undefined,
	params?: FormatParameters,
): Promise<Out | undefined>;
export async function getConfigVariable<Out>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Out>,
	defaultValue?: Out | undefined,
	params?: FormatParameters,
): Promise<Out | undefined> {
	for (const loader of loaders) {
		try {
			const {value, path} = await loader.callback(rootKey);
			if (value) {
				const preValid = await parser.preValidate?.(rootKey, value);
				if (preValid && !preValid.success) {
					throw new Error(`variables: ${preValid.message}`);
				}
				const output = await parser.parse(rootKey, value);
				const postValid = await parser.postValidate?.(rootKey, output);
				if (postValid && !postValid.success) {
					throw new Error(`variables: ${postValid.message}`);
				}
				printLog(loader.type, rootKey, parser.toString(output), path, params);
				return output;
			}
		} catch (err) {
			logger?.error(err);
		}
	}
	if (defaultValue) {
		printLog('default', rootKey, parser.toString(defaultValue), 'default', params);
	}
	return defaultValue || undefined;
}

function printLog(type: string, key: string, value: string, path: string, params?: FormatParameters) {
	logger?.info(`ConfigVariables[${type}]: ${key}${printValue(value, params)} from ${path}`);
}
