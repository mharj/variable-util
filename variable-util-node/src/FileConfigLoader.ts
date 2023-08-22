import {ConfigLoader, Loadable, LoaderValue, VariableError} from '@avanio/variable-util';
import {existsSync} from 'fs';
import {ILoggerLike} from '@avanio/logger-like';
import {readFile} from 'fs/promises';

export interface FileConfigLoaderOptions {
	fileName: string;
	type: 'json';
	/** set to false if need errors */
	isSilent: boolean;
	logger: ILoggerLike | undefined;
	disabled: boolean;
}

export class FileConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'file';
	private options: Loadable<Partial<FileConfigLoaderOptions>>;
	private filePromise: Promise<Record<string, string | undefined>> | undefined;

	private defaultOptions: FileConfigLoaderOptions = {
		disabled: false,
		fileName: 'config.json',
		isSilent: true,
		logger: undefined,
		type: 'json',
	};

	public constructor(options: Loadable<Partial<FileConfigLoaderOptions>> = {}) {
		super();
		this.options = options;
		this.getLoader = this.getLoader.bind(this);
	}

	public async reload(): Promise<void> {
		this.filePromise = this.loadFile(await this.getOptions());
		await this.filePromise;
	}

	public isLoaded(): boolean {
		return this.filePromise !== undefined;
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		if (!this.filePromise) {
			this.filePromise = this.loadFile(options);
		}
		const data = await this.filePromise;
		const targetKey = key || rootKey;
		return {type: this.type, result: {value: data[targetKey], path: options.fileName}};
	}

	private async loadFile(options: FileConfigLoaderOptions): Promise<Record<string, string | undefined>> {
		if (!existsSync(options.fileName)) {
			const msg = this.buildErrorStr(`file ${options.fileName} not found`);
			if (options.isSilent) {
				options.logger?.debug(msg);
				return {};
			}
			throw new VariableError(msg);
		}
		try {
			return JSON.parse(await readFile(options.fileName, 'utf8'));
		} catch (err) {
			const msg = this.buildErrorStr(`file ${options.fileName} is not a valid JSON`);
			if (options.isSilent) {
				options.logger?.info(msg);
				return {};
			}
			throw new VariableError(msg);
		}
	}

	private async getOptions(): Promise<FileConfigLoaderOptions> {
		const options = await (typeof this.options === 'function' ? this.options() : this.options);
		return Object.assign({}, this.defaultOptions, options);
	}
}
