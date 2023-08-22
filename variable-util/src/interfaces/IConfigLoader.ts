export interface LoaderValueResult {
	/** this is shown on logs "ConfigVariables[type]: KEY [___VALUE___] from {path}" if showValue is true */
	value: string | undefined;
	/** this is shown on logs "ConfigVariables[type]: KEY [VALUE] from {___path___}" */
	path: string;
}

/**
 * Interface for the LoaderValue output payload
 */
export interface LoaderValue {
	/** this is shown on logs "ConfigVariables[___type___]: ___KEY___ [VALUE] from {path}" */
	type: string;
	/** callback result or undefined if disabled */
	result: LoaderValueResult | undefined;
}

/**
 * Interface for config loaders
 */
export interface IConfigLoader {
	/** this is shown on logs "ConfigVariables[___type___]: KEY [VALUE] from {path}" */
	type: string;
	/** callback Promise function that returns the LoaderValue */
	callback(lookupKey: string): Promise<LoaderValue>;
}
