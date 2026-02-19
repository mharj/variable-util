/**
 * Loader type value
 * @template T - type of value
 * @since 0.2.18
 */
export type LoaderTypeValue<T> = {
	/** type of loader output (default, env,...) */
	type: string | undefined;
	/** output value */
	value: T | undefined;
	/** string value of output */
	stringValue: string | undefined;
	/** variable namespace */
	namespace: string | undefined;
};

/**
 * Loader type strict value
 * @template T - type of value
 * @since 0.2.18
 */
export type LoaderTypeValueStrict<T> = {
	/** type of loader output (default, env,...) */
	type: string | undefined;
	/** output value */
	value: T;
	/** string value of output */
	stringValue: string;
	/** variable namespace */
	namespace: string | undefined;
};
