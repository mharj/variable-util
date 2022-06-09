export interface GetValue {
	value: string | undefined;
	/** this is shown on logs "ConfigVariables[type]: KEY [VALUE] from {path}" */
	path: string;
}

export interface LoaderValue {
	value: string | undefined;
	/** this is shown on logs "ConfigVariables[type]: KEY [VALUE] from {path}" */
	path: string;
}
type EnvFunction = (rootKey: string) => Promise<LoaderValue>;

export interface Loader {
	type: string;
	callback: EnvFunction;
}

export abstract class ConfigLoader<T> {
	public abstract type: string;
	constructor() {
		this.getLoader = this.getLoader.bind(this);
	}

	public getLoader(params?: T): Loader {
		return {
			type: this.type,
			callback: (rootKey) => this.handleLoader(rootKey, params),
		};
	}

	protected abstract handleLoader(rootKey: string, params?: T): Promise<LoaderValue>;
}
