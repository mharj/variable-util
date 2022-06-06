export interface GetValue {
	value: string | undefined;
	/** this is shown on logs "ConfigVariables[type]: KEY [VALUE] from {path}" */
	path: string;
}

export abstract class ConfigLoader {
	public abstract type: string;
	public abstract get(key: string): Promise<GetValue>;
}
