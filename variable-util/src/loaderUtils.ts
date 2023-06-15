import {FormatParameters, printValue} from './lib/formatUtils';
import {IConfigLoader, IConfigParser} from './interfaces';
import {getLogger} from './logger';
import {ILoggerLike} from '@avanio/logger-like';
import {VariableError} from './VariableError';

export function printLog(logger: ILoggerLike | undefined, type: string, key: string, value: string, path: string, params?: FormatParameters) {
	logger?.info(`ConfigVariables[${type}]: ${key}${printValue(value, params)} from ${path}`);
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

export async function handleLoader<Output, RawOutput = unknown>(
	rootKey: string,
	loader: IConfigLoader,
	parser: IConfigParser<Output, RawOutput>,
	params?: FormatParameters,
): Promise<{type: string; value: Output | undefined} | undefined> {
	const logger = getLogger();
	try {
		const {type, value, path} = await loader.callback(rootKey);
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
			printLog(logger, loader.type, rootKey, parser.toString(output), path, params);
			return {type, value: output};
		}
	} catch (err) {
		logger?.error(err);
	}
	return undefined;
}
