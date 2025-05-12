import {type IConfigLoader} from './IConfigLoader';

/**
 * Parser method props
 * @since v0.11.0
 */
export type ParserProps = {
	loader: IConfigLoader;
	key: string;
	value: string;
};

/**
 * PreValidate method props
 * @since v0.11.0
 */
export type PreValidateProps = {
	loader: IConfigLoader;
	key: string;
	value: unknown;
};

/**
 * PostValidate method props
 * @template T - Type of value
 * @since v0.11.0
 */
export type PostValidateProps<T> = {
	loader: IConfigLoader;
	key: string;
	value: T;
};

/**
 * PreValidate function
 * @template Output - Type of output value
 * @since v1.0.0
 */
export type TypeGuardValidate<Output> = ((value: unknown) => value is Output) | Promise<(value: unknown) => value is Output>;

/**
 * String encoder options for parsers
 * @since v0.11.0
 */
export type EncodeOptions = {
	/**
	 * use URI encoding for string outputs (used by semicolon parser)
	 */
	uriEncode?: boolean;
	/**
	 * not logging the value
	 */
	silent?: boolean;
};

/**
 * Interface for config parsers
 * @template Input - Type of raw input value
 * @template Output - Type of output value
 * @since v1.0.0
 */
export interface IConfigParser<Input, Output> {
	/**
	 * name of the parser
	 */
	name: string;

	/**
	 * Config parser function
	 * @throws Error if parsing fails
	 */
	parse(parserProps: ParserProps): Input | Promise<Input>;

	/**
	 * Optional raw string value validation before parsing.
	 * @throws Error if validation fails
	 */
	preValidate?(preValidateProps: PreValidateProps): void | Promise<void>;

	/**
	 * Optional value validation after parsing
	 * @throws Error if validation fails
	 */
	postValidate?(postValidateProps: PostValidateProps<Input>): Output | undefined | Promise<Output | undefined>;

	/**
	 * Build readable string from value
	 */
	toString(config: Output, options?: EncodeOptions): string;

	/**
	 * Optional build readable string from value for log (can hide sensitive part from logs) else toString is used
	 * @param config - value to log
	 */
	toLogString?(config: Output): string;
}
