import {type ILoggerLike} from '@avanio/logger-like';

let logger: ILoggerLike | undefined;
/**
 * Set the logger to be used by the module
 * @category Utils
 * @param {ILoggerLike} newLogger - logger to be used
 * @since v0.2.18
 */
export function setLogger(newLogger: ILoggerLike): void {
	logger = newLogger;
}

/**
 * Get current logger instance
 * @category Utils
 * @returns {ILoggerLike | undefined} - current logger
 * @since v0.5.9
 */
export function getLogger(): ILoggerLike | undefined {
	return logger;
}

/**
 * resolve logger: undefined = global logger, null = no logger else it's ILoggerLike
 * @param logger - logger to resolve
 * @category Utils
 * @returns {ILoggerLike | undefined} - resolved logger
 * @since v0.5.9
 */
export function resolveLogger(logger: undefined | null | ILoggerLike): ILoggerLike | undefined {
	// if logger is undefined, return current global logger
	if (logger === undefined) {
		return getLogger();
	}
	return logger ?? undefined;
}
