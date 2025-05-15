import {type Loadable} from '@luolapeikko/ts-common';
import {type IConfigParser} from '../interfaces/IConfigParser';
import {type FormatParameters} from '../lib/formatUtils';

/**
 * Optional environment entry
 * @template Value - type of value
 * @since v1.1.0
 */
export type OptionalEnvEntry<Value> = {
	/**
	 * The parser to use to parse the value
	 */
	parser: IConfigParser<unknown, Value>;
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
	undefinedThrowsError?: boolean;
	/**
	 * Replaces the default throw error message with this message
	 */
	undefinedErrorMessage?: string;
};

/**
 * Required environment entry
 * @template Value - type of value
 * @since v1.1.0
 */
export type RequiredEnvEntry<Value> = {
	/**
	 * The parser to use to parse the value
	 */
	parser: IConfigParser<unknown, Value>;
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
 * @template Value - type of value
 * @since v1.1.0
 */
export type RequiredUndefinedThrowEntry<Value> = {
	/**
	 * The parser to use to parse the value
	 */
	parser: IConfigParser<unknown, Value>;
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
 * @template Output - type of output value
 * @since v0.2.15
 */
export type EnvMapSchema<Output extends Record<string, unknown>> = {
	[K in keyof Required<Output>]: undefined extends Output[K]
		? OptionalEnvEntry<Output[K]>
		: RequiredEnvEntry<Output[K]> | RequiredUndefinedThrowEntry<Output[K]>;
};
