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
 * @since v0.11.0
 */
export type PostValidateProps<T> = {
	loader: IConfigLoader;
	key: string;
	value: T;
};

/**
 * PreValidate function
 * @since v0.11.0
 */
export type PostValidate<Output, RawOutput> = (postValidateProps: PostValidateProps<RawOutput>) => Promise<Output | undefined>;

/**
 * String encoder options for parsers
 * @since v0.11.0
 */
export type EncodeOptions = {
	/**
	 * use URI encoding for string outputs (used by semicolon parser)
	 */
	uriEncode?: boolean;
};

/**
 * Interface for config parsers
 * @template Output - Type of output
 * @template RawOutput - Type of raw output
 * @since v0.11.0
 */
export interface IConfigParser<Output, RawOutput> {
	/**
	 * name of the parser
	 */
	name: string;

	/**
	 * Config parser function
	 * @throws Error if parsing fails
	 */
	parse(parserProps: ParserProps): RawOutput | Promise<RawOutput>;

	/**
	 * Optional raw string value validation before parsing.
	 * @throws Error if validation fails
	 */
	preValidate?(preValidateProps: PreValidateProps): void | Promise<void>;

	/**
	 * Optional value validation after parsing
	 * @throws Error if validation fails
	 */
	postValidate?(postValidateProps: PostValidateProps<RawOutput>): Output | undefined | Promise<Output | undefined>;

	/**
	 * Build readable string from value
	 */
	toString(value: Output, options?: EncodeOptions): string;

	/**
	 * Optional build readable string from value for log (can hide sensitive part from logs) else toString is used
	 * @param value - value to log
	 */
	toLogString?(value: Output): string;
}
