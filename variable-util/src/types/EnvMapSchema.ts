import {FormatParameters} from '../lib/formatUtils';
import {IConfigLoader} from '../interfaces/IConfigLoader';
import {IConfigParser} from '../interfaces/IConfigParser';
import {Loadable} from './Loadable';

export type OptionalEnvEntry<Value> = {
	loaders: IConfigLoader[];
	parser: IConfigParser<Value, unknown>;
	defaultValue?: Loadable<Value> | undefined;
	params?: FormatParameters;
};

export type RequiredEnvEntry<Value> = {
	loaders: IConfigLoader[];
	parser: IConfigParser<Value, unknown>;
	defaultValue: Loadable<Value>;
	params?: FormatParameters;
};

export type EnvMapSchema<Output extends Record<string, unknown>> = {
	[K in keyof Output]: undefined extends Output[K] ? OptionalEnvEntry<Output[K]> : RequiredEnvEntry<Output[K]>;
};
