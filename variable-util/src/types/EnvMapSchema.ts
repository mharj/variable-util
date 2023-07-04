import {FormatParameters} from '../lib/formatUtils';
import {IConfigLoader} from '../interfaces/IConfigLoader';
import {IConfigParser} from '../interfaces/IConfigParser';
import {Loadable} from './Loadable';

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
};

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
};

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
};

export type EnvMapSchema<Output extends Record<string, unknown>> = {
	[K in keyof Required<Output>]: undefined extends Output[K]
		? OptionalEnvEntry<Output[K]>
		: RequiredEnvEntry<Output[K]> | RequiredUndefinedThrowEntry<Output[K]>;
};
