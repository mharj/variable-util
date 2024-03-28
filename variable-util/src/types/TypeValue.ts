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
