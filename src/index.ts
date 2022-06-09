import {Loader} from './loaders';
import {FormatParameters, printValue} from './formatUtils';
import {LoggerLike} from './loggerLike';

let logger: LoggerLike | undefined;
export function setLogger(newLogger: LoggerLike) {
	logger = newLogger;
}

/**
 * @example
 * const port = await getConfigVariable('PORT', [env()], '8080', {showValue: true});
 */
export async function getConfigVariable(rootKey: string, loaders: Loader[], defaultValue: string, params?: FormatParameters): Promise<string>;
export async function getConfigVariable(
	rootKey: string,
	loaders: Loader[],
	defaultValue?: string | undefined,
	params?: FormatParameters,
): Promise<string | undefined>;
export async function getConfigVariable(rootKey: string, loaders: Loader[], defaultValue?: string | undefined, params?: FormatParameters) {
	for (const loader of loaders) {
		try {
			const {value, path} = await loader.callback(rootKey);
			if (value) {
				printLog(loader.type, rootKey, value, path, params);
				return value;
			}
		} catch (err) {
			logger?.error(err);
		}
	}
	if (defaultValue) {
		printLog('default', rootKey, defaultValue, 'default', params);
	}
	return defaultValue || undefined;
}

function printLog(type: string, key: string, value: string, path: string, params?: FormatParameters) {
	logger?.info(`ConfigVariables[${type}]: ${key}${printValue(value, params)} from ${path}`);
}
