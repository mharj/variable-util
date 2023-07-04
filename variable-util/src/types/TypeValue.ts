/**
 * This type gives loader type name and value
 */
export type LoaderTypeValue<T> = {
	/**
	 * Loader type
	 */
	type: string | undefined;
	/**
	 * Loader value
	 */
	value: T;
};
