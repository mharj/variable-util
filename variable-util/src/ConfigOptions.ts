import {type ILoggerLike} from '@avanio/logger-like';
import {resolveLogger} from './logger';

export type ConfigOptions = {
	/** undefined = global logger, null = no logger else it's ILoggerLike */
	logger?: ILoggerLike | null;
	/** optional namespace added to logs */
	namespace?: string;
};

export type SolvedConfigOptions = {
	/** optional logger instance */
	logger: ILoggerLike | undefined;
	/** optional namespace added to logs */
	namespace: string | undefined;
};

/**
 * Build options from partial options
 * @param {Partial<ConfigOptions>} options - partial config options
 * @returns {SolvedConfigOptions} - solved config options
 * @category Config
 */
export function buildOptions({logger, namespace}: Partial<ConfigOptions> = {}): SolvedConfigOptions {
	return {
		logger: resolveLogger(logger),
		namespace,
	};
}
