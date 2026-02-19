import type {SolvedConfigOptions} from './ConfigOptions';
import type {EncodeOptions, IConfigLoader, IConfigParser, LoaderValueResult} from './interfaces';
import {type FormatParameters, printValue} from './lib/formatUtils';
import type {LoaderTypeValue} from './types/TypeValue';
import {VariableError} from './VariableError';

/**
 * function to log variable output
 * @param {SolvedConfigOptions} options - options to use
 * @param {string} type - type of variable
 * @param {string} key - key of variable
 * @param {string} value - value of variable
 * @param {string} path - path of variable
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {void}
 * @category Utils
 * @since v1.0.0
 */
export function printLog({logger, namespace}: SolvedConfigOptions, type: string, key: string, value: string, path: string, params?: FormatParameters): void {
	const namespaceString = namespace ? `:${namespace}` : '';
	logger?.info(`ConfigVariables${namespaceString}[${type}]: ${key}${printValue(value, params)} from ${path}`);
}

/**
 * Rebuild Error as raw VariableError
 * @param {unknown} err - error to rebuild
 * @returns {VariableError} - rebuilt error
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
 * @param {IConfigLoader} loader - loader to use
 * @param {IConfigParser<unknown, unknown>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - rebuilt error
 * @category Errors
 * @since v1.0.0
 */
export function rebuildAsVariableError(
	value: string,
	error: Error,
	loader: IConfigLoader,
	parser: IConfigParser<unknown, unknown>,
	params?: FormatParameters,
): VariableError {
	if (error instanceof VariableError) {
		return error;
	} else {
		const varError = new VariableError(`variables[${loader.loaderType}](${parser.name}):${printValue(value, params)} ${error.message}`);
		varError.stack = error.stack;
		return varError;
	}
}

/**
 * build error message for preValidate step
 * @param {string} value - value of variable
 * @param {unknown} err - error to rebuild
 * @param {IConfigLoader} loader - loader to use
 * @param {IConfigParser<unknown, unknown>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - error message
 * @category Errors
 * @since v1.0.0
 */
function buildPreValidateErrorMessage(
	value: string,
	err: unknown,
	loader: IConfigLoader,
	parser: IConfigParser<unknown, unknown>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, loader, parser, params);
	} else {
		return new VariableError(`variables[${loader.loaderType}](${parser.name}):${printValue(value, params)} unknown preValidate error`);
	}
}

/**
 * build error message for parser step
 * @param {string} value - value of variable
 * @param {unknown} err - error to rebuild
 * @param {IConfigLoader} loader - loader to use
 * @param {IConfigParser<unknown, unknown>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - error message
 * @category Errors
 * @since v1.0.0
 */
function buildParserErrorMessage(
	value: string,
	err: unknown,
	loader: IConfigLoader,
	parser: IConfigParser<unknown, unknown>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, loader, parser, params);
	} else {
		return new VariableError(`variables[${loader.loaderType}](${parser.name}):${printValue(value, params)} unknown parse error`);
	}
}

/**
 * build error message for postValidate step
 * @param {string} value - value of variable
 * @param {unknown} err - error to rebuild
 * @param {IConfigLoader} loader - loader to use
 * @param {IConfigParser<unknown, unknown>} parser - parser used
 * @param {FormatParameters} [params] - optional format parameters
 * @returns {VariableError} - error message
 * @category Errors
 * @since v1.0.0
 */
function buildPostValidateErrorMessage(
	value: string,
	err: unknown,
	loader: IConfigLoader,
	parser: IConfigParser<unknown, unknown>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, loader, parser, params);
	} else {
		return new VariableError(`variables[${loader.loaderType}](${parser.name}):${printValue(value, params)} unknown postValidate error`);
	}
}

/**
 * Get result from loader
 * @param {IConfigLoader} loader - loader to use
 * @param {string} rootKey - key of variable
 * @returns {Promise<LoaderValueResult | undefined>} - result of loader
 */
async function getResult(loader: IConfigLoader, rootKey: string): Promise<LoaderValueResult | undefined> {
	if (await loader.isLoaderDisabled()) {
		return undefined;
	}
	return await loader.getLoaderResult(rootKey);
}

/**
 * handle function for loader
 * @template Input - Type of input value
 * @template Output - Type of output value
 * @param {string} rootKey - key of variable
 * @param {IConfigLoader} loader - loader to use
 * @param {IConfigParser<Output, RawOutput>} parser - parser to use
 * @param {FormatParameters} [params] - optional format parameters
 * @param {SolvedConfigOptions} options - options to use
 * @param {EncodeOptions} [encodeOptions] - optional encode options
 * @returns {Promise<{type: string; value: Output | undefined} | undefined>} - parsed value
 * @since v1.0.0
 */
export async function handleLoader<Input, Output>(
	rootKey: string,
	loader: IConfigLoader,
	parser: IConfigParser<Input, Output>,
	params: FormatParameters | undefined,
	options: SolvedConfigOptions,
	encodeOptions: EncodeOptions | undefined,
): Promise<LoaderTypeValue<Output> | undefined> {
	try {
		const result = await getResult(loader, rootKey);
		// check if result is undefined (disabled loaders or no value)
		if (!result) {
			return undefined;
		}
		const {value, path, seen} = result;
		if (value) {
			/**
			 * parser pre-validate
			 */
			try {
				await parser.preValidate?.({key: rootKey, loader, value});
			} catch (err) {
				throw buildPreValidateErrorMessage(value, err, loader, parser, params);
			}
			/**
			 * parse value
			 */
			let rawOutput: Input;
			try {
				rawOutput = await parser.parse({key: rootKey, loader, value});
			} catch (err) {
				throw buildParserErrorMessage(value, err, loader, parser, params);
			}
			/**
			 * parser post-validate
			 */
			let output: Output = rawOutput as unknown as Output; // TODO: if validator on parser is not defined we should return RawOutput type
			try {
				const validateData = await parser.postValidate?.({key: rootKey, loader, value: rawOutput});
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
				printLog(options, loader.loaderType, rootKey, logValue, path, params);
			}
			return {namespace: options.namespace, stringValue, type: loader.loaderType, value: output};
		}
	} catch (err) {
		options.logger?.error(err);
	}
	return undefined;
}
