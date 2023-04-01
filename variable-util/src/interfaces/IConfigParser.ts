export interface IConfigParser<Output, RawOutput> {
	/**
	 * name of the parser (not used yet)
	 */
	name: string;

	/**
	 * main parsing function
	 * @throws Error if parsing fails
	 */
	parse(key: string, value: string): Promise<RawOutput>;

	/**
	 * optional raw string value validation before parsing.
	 * @throws Error if validation fails
	 */
	preValidate?(key: string, value: string): Promise<void>;

	/**
	 * optional value validation after parsing
	 * @throws Error if validation fails
	 */
	postValidate?(key: string, value: RawOutput): Promise<Output | undefined>;

	/**
	 * build readable string from value
	 */
	toString(value: Output): string;
}
