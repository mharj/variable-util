import {type EncodeOptions, type IConfigLoader, type IConfigParser} from './interfaces';
import {type FormatParameters, printValue} from './lib/formatUtils';
import {type LoaderTypeValue} from './types/TypeValue';
import {type SolvedConfigOptions} from './ConfigOptions';
import {VariableError} from './VariableError';

/**
 * function to log variable output
 * @param logger - logger to use
 * @param type - type of loader
 * @param key - key of variable
 * @param value - value of variable
 * @param path - path from loader
 * @param params - optional format parameters
 * @category Utils
 */
export function printLog({logger, namespace}: SolvedConfigOptions, type: string, key: string, value: string, path: string, params?: FormatParameters): void {
	const namespaceString = namespace ? `:${namespace}` : '';
	logger?.info(`ConfigVariables${namespaceString}[${type}]: ${key}${printValue(value, params)} from ${path}`);
}

/**
 * Rebuild Error as raw VariableError
 * @category Utils
 * @since v0.12.0
 */
export function handleAsVariableError(err: unknown): VariableError {
	if (err instanceof VariableError) {
		return err;
	}
	if (err instanceof Error) {
		const varError = new VariableError(err.message);
		varError.stack = err.stack;
		return varError;
	}
	return new VariableError(`Unknown error ${JSON.stringify(err)}`);
}

/**
 * Rebuild Error as VariableError
 * @param {string} value - value of variable
 * @param {Error} error - error to rebuild
 * @param {IConfigParser<Output, RawOutput>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - rebuilt error
 * @category Errors
 */
export function rebuildAsVariableError<Output, RawOutput = unknown>(
	value: string,
	error: Error,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (error instanceof VariableError) {
		return error;
	} else {
		const varError = new VariableError(`variables[${loader.type}](${parser.name}):${printValue(value, params)} ${error.message}`);
		varError.stack = error.stack;
		return varError;
	}
}

/**
 * build error message for preValidate step
 * @param {string} value - value of variable
 * @param {unknown} err - error to rebuild
 * @param {IConfigParser<Output, RawOutput>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @category Errors
 */
function buildPreValidateErrorMessage<Output, RawOutput = unknown>(
	value: string,
	err: unknown,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, loader, parser, params);
	} else {
		return new VariableError(`variables[${loader.type}](${parser.name}):${printValue(value, params)} unknown preValidate error`);
	}
}

/**
 * build error message for parser step
 * @param {string} value - value of variable
 * @param {unknown} err - error to rebuild
 * @param {IConfigParser<Output, RawOutput>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - error message
 * @category Errors
 */
function buildParserErrorMessage<Output, RawOutput = unknown>(
	value: string,
	err: unknown,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, loader, parser, params);
	} else {
		return new VariableError(`variables[${loader.type}](${parser.name}):${printValue(value, params)} unknown parse error`);
	}
}

/**
 * build error message for postValidate step
 * @param {string} value - value of variable
 * @param {unknown} err - error to rebuild
 * @param {IConfigParser<Output, RawOutput>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - error message
 * @category Errors
 */
function buildPostValidateErrorMessage<Output, RawOutput = unknown>(
	value: string,
	err: unknown,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, loader, parser, params);
	} else {
		return new VariableError(`variables[${loader.type}](${parser.name}):${printValue(value, params)} unknown postValidate error`);
	}
}

/**
 * handle function for loader
 * @param {string} rootKey - key of variable
 * @param {IConfigLoader} loader - loader to use
 * @param {IConfigParser<Output, RawOutput>} parser - parser to use
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {Promise<{type: string; value: Output | undefined} | undefined>} - parsed value
 */
export async function handleLoader<Output, RawOutput = unknown>(
	rootKey: string,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params: FormatParameters | undefined,
	options: SolvedConfigOptions,
	encodeOptions: EncodeOptions | undefined,
): Promise<LoaderTypeValue<Output> | undefined> {
	try {
		const {type, result} = await loader.callback(rootKey);
		// check if result is undefined (disabled loaders)
		if (!result) {
			return undefined;
		}
		const {value, path, seen} = result;
		if (value) {
			/**
			 * parser pre-validate
			 */
			try {
				await parser.preValidate?.({key: rootKey, value, loader});
			} catch (err) {
				throw buildPreValidateErrorMessage(value, err, loader, parser, params);
			}
			/**
			 * parse value
			 */
			let rawOutput: RawOutput;
			try {
				rawOutput = await parser.parse({key: rootKey, value, loader});
			} catch (err) {
				throw buildParserErrorMessage(value, err, loader, parser, params);
			}
			/**
			 * parser post-validate
			 */
			let output: Output = rawOutput as unknown as Output; // TODO: if validator on parser is not defined we should return RawOutput type
			try {
				const validateData = await parser.postValidate?.({key: rootKey, value: rawOutput, loader});
				if (validateData) {
					output = validateData;
				}
			} catch (err) {
				throw buildPostValidateErrorMessage(value, err, loader, parser, params);
			}
			/**
			 * print log
			 */
			const stringValue = parser.toString(output, encodeOptions);
			if (!seen && !encodeOptions?.silent) {
				const logValue = parser.toLogString?.(output) ?? stringValue;
				printLog(options, loader.type, rootKey, logValue, path, params);
			}
			return {namespace: options.namespace, stringValue, type, value: output};
		}
	} catch (err) {
		options.logger?.error(err);
	}
	return undefined;
}
