/**
 * PreValidate function
 * @since v0.3.0
 */
export type PostValidate<Output, RawOutput> = (key: string, value: RawOutput) => Promise<Output | undefined>;

/**
 * String encoder options for parsers
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
 * @since v0.3.1
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
	parse(key: string, value: string): RawOutput | Promise<RawOutput>;

	/**
	 * Optional raw string value validation before parsing.
	 * @throws Error if validation fails
	 */
	preValidate?(key: string, value: unknown): void | Promise<void>;

	/**
	 * Optional value validation after parsing
	 * @throws Error if validation fails
	 */
	postValidate?(key: string, value: RawOutput): Output | undefined | Promise<Output | undefined>;

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
