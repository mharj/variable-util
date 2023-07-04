import {ILoggerLike} from '@avanio/logger-like';

let logger: ILoggerLike | undefined;
/**
 * Set the logger to be used by the module
 * @category Utils
 * @param {ILoggerLike} newLogger - logger to be used
 */
export function setLogger(newLogger: ILoggerLike): void {
	logger = newLogger;
}

/**
 * Get current logger instance
 * @category Utils
 * @returns {ILoggerLike | undefined} - current logger
 */
export function getLogger(): ILoggerLike | undefined {
	return logger;
}
