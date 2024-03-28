import {buildStringObject, ConfigLoader, isValidObject, Loadable, LoaderValue, ValidateCallback, VariableError} from '@avanio/variable-util';
import {existsSync} from 'fs';
import {ILoggerLike} from '@avanio/logger-like';
import {readFile} from 'fs/promises';

export interface FileConfigLoaderOptions {
	/** file name to load, default is 'config.json' */
	fileName: string;
	/** file type to load, only 'json' supported atm */
	type: 'json';
	/** set to false if need errors */
	isSilent: boolean;
	/** optional logger */
	logger: ILoggerLike | undefined;
	/** set to true to disable loader, default is false */
	disabled: boolean;
	/**
	 * optional validator for JSON data (Record<string, string | undefined>)
	 *
	 * @example
	 * // using zod
	 * const stringRecordSchema = z.record(z.string().min(1), z.string());
	 * const validate: ValidateCallback<Record<string, string>> = async (data) => {
	 *   const result = await stringRecordSchema.safeParseAsync(data);
	 *   if (!result.success) {
	 *     return {success: false, message: result.error.message};
	 *   }
	 *   return {success: true};
	 * };
	 */
	validate: ValidateCallback<Record<string, string | undefined>, Record<string, string | undefined>> | undefined;
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
		validate: undefined,
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
			const options = await this.getOptions();
			const rawData = JSON.parse(await readFile(options.fileName, 'utf8'));
			if (!isValidObject(rawData)) {
				throw new Error(`is not valid JSON object`);
			}
			const data = buildStringObject(rawData);
			if (options.validate) {
				return await options.validate(data);
			}
			return data;
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
