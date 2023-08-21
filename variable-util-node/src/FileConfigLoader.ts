import {ConfigLoader, Loadable, LoaderValue, VariableError} from '@avanio/variable-util';
import {existsSync} from 'fs';
import {ILoggerLike} from '@avanio/logger-like';
import {readFile} from 'fs/promises';

export interface FileConfigLoaderOptions {
	fileName: Loadable<string>;
	type: 'json';
	/** set to false if need errors */
	isSilent?: boolean;
	logger?: ILoggerLike;
	disabled?: boolean;
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
		if (this.options.disabled) {
			return {value: undefined, path: 'undefined', type: this.type};
		}
		if (!this.filePromise) {
			this.filePromise = this.loadFile();
		}
		const fileName = await this.getFileName();
		const data = await this.filePromise;
		const targetKey = key || rootKey;
		return {value: data[targetKey], path: fileName, type: this.type};
	}

	private async loadFile(): Promise<Record<string, string | undefined>> {
		const fileName = await this.getFileName();
		if (!existsSync(fileName)) {
			const msg = this.buildErrorStr(`file ${fileName} not found`);
			if (this.options.isSilent) {
				this.options.logger?.debug(msg);
				return {};
			}
			throw new VariableError(msg);
		}
		try {
			return JSON.parse(await readFile(fileName, 'utf8'));
		} catch (err) {
			const msg = this.buildErrorStr(`file ${fileName} is not a valid JSON`);
			if (this.options.isSilent) {
				this.options.logger?.info(msg);
				return {};
			}
			throw new VariableError(msg);
		}
	}

	private async getFileName(): Promise<string> {
		return typeof this.options.fileName === 'function' ? this.options.fileName() : this.options.fileName;
	}
}
