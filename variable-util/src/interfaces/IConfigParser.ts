/**
 * Interface for config parsers
 * @template Output - Type of output
 * @template RawOutput - Type of raw output
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
	parse(key: string, value: string): Promise<RawOutput>;

	/**
	 * Optional raw string value validation before parsing.
	 * @throws Error if validation fails
	 */
	preValidate?(key: string, value: string): Promise<void>;

	/**
	 * Optional value validation after parsing
	 * @throws Error if validation fails
	 */
	postValidate?(key: string, value: RawOutput): Promise<Output | undefined>;

	/**
	 * Build readable string from value
	 */
	toString(value: Output): string;
}
