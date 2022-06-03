export interface GetValue {
	value: string | undefined;
	path: string;
}

export abstract class Config {
	public abstract type: string;
	public abstract get(key: string): Promise<GetValue>;
}
