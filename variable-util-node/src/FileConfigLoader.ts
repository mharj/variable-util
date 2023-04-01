import {existsSync} from 'fs';
import {readFile} from 'fs/promises';
import {ConfigLoader, LoaderValue, VariableError, ILoggerLike} from '@avanio/variable-util/';

export interface FileConfigLoaderOptions {
	fileName: string;
	type: 'json';
	/** set to false if need errors */
	isSilent?: boolean;
	logger?: ILoggerLike;
}

export class FileConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'file';
	private options: FileConfigLoaderOptions;
	private filePromise: Promise<Record<string, string | undefined>> | undefined;

	public constructor(options: FileConfigLoaderOptions) {
		super();
		this.options = {isSilent: true, ...options};
		this.getLoader = this.getLoader.bind(this);
	}

	public async reload(): Promise<void> {
		this.filePromise = this.loadFile();
		await this.filePromise;
	}

	public isLoaded(): boolean {
		return this.filePromise !== undefined;
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		if (!this.filePromise) {
			this.filePromise = this.loadFile();
		}
		const data = await this.filePromise;
		const targetKey = key || rootKey;
		return {value: data[targetKey], path: this.options.fileName};
	}

	private async loadFile(): Promise<Record<string, string | undefined>> {
		if (!existsSync(this.options.fileName)) {
			if (this.options.isSilent) {
				this.options.logger?.debug(`ConfigVariables[file]: file ${this.options.fileName} not found`);
				return {};
			}
			throw new VariableError(`ConfigVariables[file]: file ${this.options.fileName} not found`);
		}
		try {
			return JSON.parse(await readFile(this.options.fileName, 'utf8'));
		} catch (err) {
			if (this.options.isSilent) {
				this.options.logger?.info(`ConfigVariables[file]: file ${this.options.fileName} is not a valid JSON`);
				return {};
			}
			throw new VariableError(`ConfigVariables[file]: file ${this.options.fileName} is not a valid JSON`);
		}
	}
}
