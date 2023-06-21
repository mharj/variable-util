import {FormatParameters} from '../lib/formatUtils';
import {IConfigLoader} from '../interfaces/IConfigLoader';
import {IConfigParser} from '../interfaces/IConfigParser';
import {Loadable} from './Loadable';

export type OptionalEnvEntry<Value> = {
	loaders: IConfigLoader[];
	parser: IConfigParser<Value, unknown>;
	defaultValue?: Loadable<Value> | undefined;
	params?: FormatParameters;
	undefinedThrowsError?: boolean;
};

export type RequiredEnvEntry<Value> = {
	loaders: IConfigLoader[];
	parser: IConfigParser<Value, unknown>;
	defaultValue: Loadable<Value>;
	params?: FormatParameters;
	undefinedThrowsError?: boolean;
};

export type RequiredUndefinedThrowEntry<Value> = {
	loaders: IConfigLoader[];
	parser: IConfigParser<Value, unknown>;
	defaultValue?: Loadable<Value>;
	params?: FormatParameters;
	undefinedThrowsError: true;
};

export type EnvMapSchema<Output extends Record<string, unknown>> = {
	[K in keyof Required<Output>]: undefined extends Output[K]
		? OptionalEnvEntry<Output[K]>
		: RequiredEnvEntry<Output[K]> | RequiredUndefinedThrowEntry<Output[K]>;
};
