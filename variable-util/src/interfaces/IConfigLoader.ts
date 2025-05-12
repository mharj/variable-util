/**
 * Represents the result of loading a configuration value.
 * @property value - The value associated with the configuration key, or `undefined` if not found.
 * @property path - The source path from which the value was loaded.
 * @property seen - Indicates whether the key and value have already been encountered (used for logging purposes).
 * @since v0.8.0
 * @category Loaders
 */
export type LoaderValueResult = {
	/** this is shown on logs `ConfigVariables[type]: KEY [___VALUE___] from {path}` if showValue is true */
	value: string | undefined;
	/** this is shown on logs `ConfigVariables[type]: KEY [VALUE] from {___path___}` */
	path: string;
	/** is key and value already seen (for logging) */
	seen: boolean;
};

/**
 * Interface for config loaders
 * @since v1.0.0
 * @category Loaders
 */
export interface IConfigLoader {
	/** this is shown on logs `ConfigVariables[___type___]: KEY [VALUE] from {path}` */
	readonly loaderType: Lowercase<string>;
	/**
	 * get loader result for lookupKey
	 * @param {string} lookupKey - key to lookup
	 * @returns {undefined | LoaderValueResult | Promise<undefined | LoaderValueResult>} - Promise of LoaderValueResult or undefined
	 */
	getLoaderResult(lookupKey: string): undefined | LoaderValueResult | Promise<undefined | LoaderValueResult>;
	/**
	 * Check if loader is disabled
	 * @returns {boolean | undefined | Promise<boolean | undefined>} - Promise of boolean or undefined
	 */
	isLoaderDisabled(): boolean | undefined | Promise<boolean | undefined>;
}

/**
 * Helper type to write override keys to config loaders
 * @since v1.0.0
 * @category Loaders
 * @example
 * type OverrideKeyMap = InferOverrideKeyMap<MainEnv & TestEnv>;
 * // Example usage of OverrideKeyMap, where the keys are the original config keys and the values are the override keys
 * const env = new EnvConfigLoader<OverrideKeyMap>(undefined, {PORT: 'HTTP_PORT'}); // get PORT value from process.env.HTTP_PORT
 */
export type OverrideKeyMap = Record<string, string>;

/**
 * Helper infer type to write override keys to config loaders
 * @template T - The type of the config object.
 * @since v1.0.0
 * @category Loaders
 * @example
 * type OverrideKeyMap = InferOverrideKeyMap<MainEnv & TestEnv>;
 * // Example usage of OverrideKeyMap, where the keys are the original config keys and the values are the override keys
 * const env = new EnvConfigLoader<OverrideKeyMap>(undefined, {PORT: 'HTTP_PORT'}); // get PORT value from process.env.HTTP_PORT
 */
export type InferOverrideKeyMap<T> = Record<keyof T, string>;
