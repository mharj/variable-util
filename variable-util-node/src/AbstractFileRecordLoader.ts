import {existsSync, type FSWatcher, watch} from 'fs';
import {readFile} from 'fs/promises';
import type {ILoggerLike} from '@avanio/logger-like';
import {type IConfigLoaderProps, type LoaderValue, RecordConfigLoader, type ValidateCallback, VariableError} from '@avanio/variable-util';
import {type Loadable, toError} from '@luolapeikko/ts-common';

/**
 * Options for the AbstractFileRecordLoader.
 * @since v0.8.0
 */
export interface AbstractFileRecordLoaderOptions<FileType extends string> extends IConfigLoaderProps {
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
}

/**
 * Abstract class for loading records from a file.
 * @since v0.8.0
 */
export abstract class AbstractFileRecordLoader<
	Options extends AbstractFileRecordLoaderOptions<string> = AbstractFileRecordLoaderOptions<string>,
> extends RecordConfigLoader<string | undefined, Partial<Options>, Options> {
	abstract readonly type: Lowercase<string>;
	private watcher: FSWatcher | undefined;
	private timeout: ReturnType<typeof setTimeout> | undefined;

	protected abstract defaultOptions: Options;

	public constructor(options: Loadable<Partial<Options>>) {
		super(options);
		this.getLoader = this.getLoader.bind(this);
		this.handleFileChange = this.handleFileChange.bind(this);
	}

	/**
	 * If the loader is watching the file, it will stop watching.
	 */
	public async close(): Promise<void> {
		if (this.watcher) {
			const {logger, fileName} = await this.getOptions();
			logger?.debug(this.buildErrorStr(`closing file watcher for ${fileName}`));
			this.watcher.close();
		}
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const {disabled, fileName} = await this.getOptions();
		if (disabled) {
			return {type: this.type, result: undefined};
		}
		if (!this.dataPromise) {
			this.dataPromise = this.handleData();
		}
		const data = await this.dataPromise;
		const targetKey = key || rootKey;
		const currentValue = data[targetKey];
		return {type: this.type, result: {value: currentValue, path: fileName, seen: this.handleSeen(targetKey, currentValue)}};
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
		} catch (_err) {
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
				if (this.timeout) {
					clearTimeout(this.timeout);
				}
				// delay to prevent multiple reloads
				this.timeout = setTimeout(() => {
					void this.handleFileChange(options);
				}, 200);
			});
		}
	}

	private async handleFileChange(options: Options): Promise<void> {
		try {
			options.logger?.debug(this.buildErrorStr(`file ${options.fileName} changed`));
			await this.reload();
		} catch (err) {
			options.logger?.error(this.buildErrorStr(`error reloading file ${options.fileName}: ${toError(err).message}`));
		}
	}
}
