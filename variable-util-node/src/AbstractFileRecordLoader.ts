import {existsSync, type FSWatcher, watch} from 'fs';
import {readFile} from 'fs/promises';
import type {ILoggerLike} from '@avanio/logger-like';
import {
	applyStringMap,
	type IConfigLoaderProps,
	type LoaderValue,
	MapConfigLoader,
	type OverrideKeyMap,
	type ValidateCallback,
	VariableError,
} from '@avanio/variable-util';
import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import {type Loadable, toError} from '@luolapeikko/ts-common';

/**
 * Options for the AbstractFileRecordLoader.
 * @template FileType Type of the file
 * @since v1.0.0
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
 * @template Options Options for the loader
 * @template OverrideMap Type of the override keys
 * @since v1.0.0
 */
export abstract class AbstractFileRecordLoader<
	Options extends AbstractFileRecordLoaderOptions<string> = AbstractFileRecordLoaderOptions<string>,
	OverrideMap extends OverrideKeyMap = OverrideKeyMap,
> extends MapConfigLoader<Options, OverrideMap> {
	abstract readonly loaderType: Lowercase<string>;
	protected abstract defaultOptions: Options;
	private watcher: FSWatcher | undefined;
	private timeout: ReturnType<typeof setTimeout> | undefined;

	public constructor(options: Loadable<Partial<Options>>, overrideKeys?: Partial<OverrideMap>) {
		super(options, overrideKeys);
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

	protected async handleLoaderValue(lookupKey: string): Promise<LoaderValue> {
		const {fileName} = await this.getOptions();
		if (!this._isLoaded) {
			await this.loadData();
			this._isLoaded = true; // only load data once to prevent spamming
		}
		const value = this.data.get(lookupKey);
		return {value, path: fileName};
	}

	protected async handleData(): Promise<IResult<Record<string, string | undefined>, VariableError>> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`loading file ${options.fileName}`));
		if (!existsSync(options.fileName)) {
			return Err(new VariableError(this.buildErrorStr(`file ${options.fileName} not found`)));
		}
		let buffer;
		try {
			buffer = await readFile(options.fileName);
		} catch (unknownErr) {
			return Err(new VariableError(toError(unknownErr).message));
		}
		try {
			let data = await this.handleParse(buffer, options);
			if (options.validate) {
				data = await options.validate(data);
			}
			this.handleFileWatch(options); // add watch after successful load
			return Ok(data);
		} catch (_err) {
			return Err(new VariableError(this.buildErrorStr(`file ${options.fileName} is not a valid ${options.fileType}`)));
		}
	}

	protected async handleLoadData(): Promise<boolean> {
		const {logger, isSilent} = await this.getOptions();
		const res = await this.handleData();
		if (res.isErr) {
			if (!isSilent) {
				res.unwrap();
			} else {
				logger?.debug(res.err());
			}
			return false;
		}
		applyStringMap(res.ok(), this.data);
		return true;
	}

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

	/**
	 * Handle the parsing of the file.
	 */
	protected abstract handleParse(rawData: Buffer, options: Options): Record<string, string | undefined> | Promise<Record<string, string | undefined>>;
}
