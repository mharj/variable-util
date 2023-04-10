import {FormatParameters, printValue} from './lib/formatUtils';
import {IConfigLoader, IConfigParser, ILoggerLike} from './interfaces/';
import {Loadable} from './types/Loadable';
import {VariableError} from './VariableError';

let logger: ILoggerLike | undefined;
export function setLogger(newLogger: ILoggerLike) {
	logger = newLogger;
}

export function rebuildAsVariableError<Output, RawOutput = unknown>(
	value: string,
	error: Error,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (error instanceof VariableError) {
		return error;
	} else {
		const varError = new VariableError(`variables[${parser.name}]:${printValue(value, params)} ${error.message}`);
		varError.stack = error.stack;
		return varError;
	}
}

function buildPreValidateErrorMessage<Output, RawOutput = unknown>(
	value: string,
	err: unknown,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, parser, params);
	} else {
		return new VariableError(`variables[${parser.name}]:${printValue(value, params)} unknown preValidate error`);
	}
}

function buildParserErrorMessage<Output, RawOutput = unknown>(
	value: string,
	err: unknown,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, parser, params);
	} else {
		return new VariableError(`variables[${parser.name}]:${printValue(value, params)} unknown parse error`);
	}
}

function buildPostValidateErrorMessage<Output, RawOutput = unknown>(
	value: string,
	err: unknown,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, parser, params);
	} else {
		return new VariableError(`variables[${parser.name}]:${printValue(value, params)} unknown postValidate error`);
	}
}

async function handleLoader<Output, RawOutput = unknown>(
	rootKey: string,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): Promise<Output | undefined> {
	try {
		const {value, path} = await loader.callback(rootKey);
		if (value) {
			/**
			 * pre-validate
			 */
			try {
				await parser.preValidate?.(rootKey, value);
			} catch (err) {
				throw buildPreValidateErrorMessage(value, err, parser, params);
			}
			/**
			 * parse
			 */
			let rawOutput: RawOutput;
			try {
				rawOutput = await parser.parse(rootKey, value);
			} catch (err) {
				throw buildParserErrorMessage(value, err, parser, params);
			}
			/**
			 * post-validate
			 */
			let output: Output = rawOutput as unknown as Output; // TODO: if validator on parser is not defined we should return RawOutput type
			try {
				const validateData = await parser.postValidate?.(rootKey, rawOutput);
				if (validateData) {
					output = validateData;
				}
			} catch (err) {
				throw buildPostValidateErrorMessage(value, err, parser, params);
			}
			/**
			 * print log
			 */
			printLog(loader.type, rootKey, parser.toString(output), path, params);
			return output;
		}
	} catch (err) {
		logger?.error(err);
	}
	return undefined;
}

/**
 * @example
 * // from "@avanio/variable-util-node"
 * const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
 *
 * const port: Promise<string> = await getConfigVariable('PORT', [env(), fileEnv()], stringParser, '8080', {showValue: true});
 * // with override key
 * const port: Promise<string> = await getConfigVariable('PORT', [env('HTTP_PORT', fileEnv())], stringParser, '8080', {showValue: true});
 */
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable: Loadable<Output>,
	params?: FormatParameters,
): Promise<Output>;
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<Output | undefined>;
export async function getConfigVariable<Output>(
	rootKey: string,
	loaders: IConfigLoader[],
	parser: IConfigParser<Output, unknown>,
	defaultValueLoadable?: Loadable<Output> | undefined,
	params?: FormatParameters,
): Promise<Output | undefined> {
	let defaultValue: Output | undefined;
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
		} catch (err) {
			logger?.error(err);
			throw err;
		}
	}
	for (const loader of loaders) {
		const output = await handleLoader(rootKey, loader, parser, params);
		if (output !== undefined) {
			return output;
		}
	}
	if (defaultValue) {
		printLog('default', rootKey, parser.toString(defaultValue), 'default', params);
	}
	return defaultValue;
}

function printLog(type: string, key: string, value: string, path: string, params?: FormatParameters) {
	logger?.info(`ConfigVariables[${type}]: ${key}${printValue(value, params)} from ${path}`);
}
