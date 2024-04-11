import {existsSync, FSWatcher, watch} from 'fs';
import {Loadable, LoaderValue, RecordConfigLoader, ValidateCallback, VariableError} from '@avanio/variable-util';
import type {ILoggerLike} from '@avanio/logger-like';
import {readFile} from 'fs/promises';

export type AbstractFileRecordLoaderOptions<FileType extends string> = {
	fileType: FileType;
	/** file name to load */
	fileName: string;
	/** set to false if need errors */
	isSilent: boolean;
	/** optional logger */
	logger: ILoggerLike | undefined;
	/** set to true to watch file for changes */
	watch: boolean;
	/** set to true to disable loader */
	disabled: boolean;
	/**
	 * optional validator for data (Record<string, string | undefined>)
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
};

export abstract class AbstractFileRecordLoader<
	Options extends AbstractFileRecordLoaderOptions<string> = AbstractFileRecordLoaderOptions<string>,
> extends RecordConfigLoader<string | undefined> {
	abstract readonly type: string;
	protected options: Loadable<Partial<Options>> | undefined;
	private watcher: FSWatcher | undefined;

	protected abstract defaultOptions: Options;

	public constructor(options?: Loadable<Partial<Options>>) {
		super();
		this.options = options;
		this.getLoader = this.getLoader.bind(this);
	}

	/**
	 * If the loader is watching the file, it will stop watching.
	 */
	public async close(): Promise<void> {
		if (this.watcher) {
			const options = await this.getOptions();
			options.logger?.debug(this.buildErrorStr(`closing file watcher for ${options.fileName}`));
			this.watcher.close();
		}
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		if (!this.dataPromise) {
			this.dataPromise = this.handleData();
		}
		const data = await this.dataPromise;
		const targetKey = key || rootKey;
		return {type: this.type, result: {value: data[targetKey], path: options.fileName}};
	}

	protected async handleData(): Promise<Record<string, string | undefined>> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`loading file ${options.fileName}`));
		// if file is disabled, return empty object
		if (options.disabled) {
			return {};
		}
		if (!existsSync(options.fileName)) {
			const msg = this.buildErrorStr(`file ${options.fileName} not found`);
			if (options.isSilent) {
				options.logger?.debug(msg);
				return {};
			}
			throw new VariableError(msg);
		}
		try {
			const data = await this.handleParse(await readFile(options.fileName), options);
			if (options.validate) {
				return await options.validate(data);
			}
			this.handleFileWatch(options); // add watch after successful load
			return data;
		} catch (err) {
			const msg = this.buildErrorStr(`file ${options.fileName} is not a valid ${options.fileType}`);
			if (options.isSilent) {
				options.logger?.info(msg);
				return {};
			}
			throw new VariableError(msg);
		}
	}

	/**
	 * Handle the parsing of the file.
	 */
	protected abstract handleParse(rawData: Buffer, options: Options): Record<string, string | undefined> | Promise<Record<string, string | undefined>>;

	private handleFileWatch(options: Options): void {
		if (options.watch && !this.watcher) {
			options.logger?.debug(this.buildErrorStr(`opening file watcher for ${options.fileName}`));
			this.watcher = watch(options.fileName, () => {
				options.logger?.debug(this.buildErrorStr(`file ${options.fileName} changed`));
				this.dataPromise = undefined; // reset file promise
			});
		}
	}

	private async getOptions(): Promise<Options> {
		const options = await (typeof this.options === 'function' ? this.options() : this.options);
		return Object.assign({}, this.defaultOptions, options || {});
	}
}
