import {FormatParameters, printValue} from './lib/formatUtils';
import {IConfigLoader, IConfigParser} from './interfaces';
import {getLogger} from './logger';
import {ILoggerLike} from '@avanio/logger-like';
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
export function printLog(logger: ILoggerLike | undefined, type: string, key: string, value: string, path: string, params?: FormatParameters): void {
	logger?.info(`ConfigVariables[${type}]: ${key}${printValue(value, params)} from ${path}`);
}

/**
 * Rebuid Error as VariableError
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
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, parser, params);
	} else {
		return new VariableError(`variables[${parser.name}]:${printValue(value, params)} unknown preValidate error`);
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
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, parser, params);
	} else {
		return new VariableError(`variables[${parser.name}]:${printValue(value, params)} unknown parse error`);
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
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): VariableError {
	if (err instanceof Error) {
		return rebuildAsVariableError(value, err, parser, params);
	} else {
		return new VariableError(`variables[${parser.name}]:${printValue(value, params)} unknown postValidate error`);
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
	params?: FormatParameters,
): Promise<{type: string; value: Output | undefined; stringValue: string | undefined} | undefined> {
	const logger = getLogger();
	try {
		const {type, value, path} = await loader.callback(rootKey);
		if (value) {
			/**
			 * parser pre-validate
			 */
			try {
				await parser.preValidate?.(rootKey, value);
			} catch (err) {
				throw buildPreValidateErrorMessage(value, err, parser, params);
			}
			/**
			 * parse value
			 */
			let rawOutput: RawOutput;
			try {
				rawOutput = await parser.parse(rootKey, value);
			} catch (err) {
				throw buildParserErrorMessage(value, err, parser, params);
			}
			/**
			 * parser post-validate
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
			const stringValue = parser.toString(output);
			printLog(logger, loader.type, rootKey, stringValue, path, params);
			return {type, value: output, stringValue};
		}
	} catch (err) {
		logger?.error(err);
	}
	return undefined;
}
