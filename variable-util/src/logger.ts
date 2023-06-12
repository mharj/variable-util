import {ILoggerLike} from '@avanio/logger-like';

let logger: ILoggerLike | undefined;
export function setLogger(newLogger: ILoggerLike) {
	logger = newLogger;
}

export function getLogger(): ILoggerLike | undefined {
	return logger;
}
