import {type FormatParameters} from '../lib/formatUtils';
import {type IConfigLoader} from '../interfaces/IConfigLoader';
import {type IConfigParser} from '../interfaces/IConfigParser';
import {type Loadable} from '@luolapeikko/ts-common';

/**
 * Optional environment entry
 * @since v0.8.0
 */
export type OptionalEnvEntry<Value> = {
	/**
	 * The loaders to use to load the value
	 */
	loaders: IConfigLoader[];
	/**
	 * The parser to use to parse the value
	 */
	parser: IConfigParser<Value, unknown>;
	/**
	 * The default value to use if the variable is not defined
	 */
	defaultValue?: Loadable<Value> | undefined;
	/**
	 * The format parameters to use to format the value
	 */
	params?: FormatParameters;
	/**
	 * Whether to throw an error if the variable is undefined
	 */
	undefinedThrowsError?: boolean;
	/**
	 * Replaces the default throw error message with this message
	 */
	undefinedErrorMessage?: string;
};

/**
 * Required environment entry
 * @since v0.8.0
 */
export type RequiredEnvEntry<Value> = {
	/**
	 * The loaders to use to load the value
	 */
	loaders: IConfigLoader[];
	/**
	 * The parser to use to parse the value
	 */
	parser: IConfigParser<Value, unknown>;
	/**
	 * The default value to use if the variable is not defined
	 */
	defaultValue: Loadable<Value>;
	/**
	 * The format parameters to use to format the value
	 */
	params?: FormatParameters;
	/**
	 * Whether to throw an error if the variable is undefined
	 */
	undefinedThrowsError?: boolean;
	/**
	 * Replaces the default throw error message with this message
	 */
	undefinedErrorMessage?: string;
};

/**
 * Required environment entry with undefinedThrowsError
 * @since v0.8.0
 */
export type RequiredUndefinedThrowEntry<Value> = {
	/**
	 * The loaders to use to load the value
	 */
	loaders: IConfigLoader[];
	/**
	 * The parser to use to parse the value
	 */
	parser: IConfigParser<Value, unknown>;
	/**
	 * The default value to use if the variable is not defined
	 */
	defaultValue?: Loadable<Value>;
	/**
	 * The format parameters to use to format the value
	 */
	params?: FormatParameters;
	/**
	 * Whether to throw an error if the variable is undefined
	 */
	undefinedThrowsError: true;
	/**
	 * Replaces the default throw error message with this message
	 */
	undefinedErrorMessage?: string;
};

/**
 * Environment map schema
 * @since v0.2.15
 */
export type EnvMapSchema<Output extends Record<string, unknown>> = {
	[K in keyof Required<Output>]: undefined extends Output[K]
		? OptionalEnvEntry<Output[K]>
		: RequiredEnvEntry<Output[K]> | RequiredUndefinedThrowEntry<Output[K]>;
};
