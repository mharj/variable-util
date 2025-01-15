import {type Loadable} from '@luolapeikko/ts-common';
import {AbstractFileRecordLoader, type AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';

/**
 * A file-based configuration loader that reads a JSON file.
 * @since v0.9.1
 */
export class FileConfigLoader extends AbstractFileRecordLoader<AbstractFileRecordLoaderOptions<'json'>> {
	public readonly type: Lowercase<string>;

	protected defaultOptions: AbstractFileRecordLoaderOptions<'json'> = {
		disabled: false,
		fileName: 'config.json',
		fileType: 'json',
		isSilent: true,
		logger: undefined,
		validate: undefined,
		watch: false,
	};

	public constructor(options: Loadable<Partial<AbstractFileRecordLoaderOptions<'json'>>>, type: Lowercase<string> = 'file') {
		super(options);
		this.type = type;
	}

	protected handleParse(rawData: Buffer, options: AbstractFileRecordLoaderOptions<'json'>): Record<string, string | undefined> {
		const data: unknown = JSON.parse(rawData.toString());
		if (typeof data !== 'object' || data === null || Array.isArray(data)) {
			options.logger?.error(`ConfigVariables[${this.type}]: Invalid JSON data from ${options.fileName}`);
			return {};
		}
		return this.convertObjectToStringRecord(data);
	}

	/**
	 * Converts an object to a record of strings as env values are always strings.
	 */
	private convertObjectToStringRecord(data: object): Record<string, string> {
		const result: Record<string, string> = {};
		for (const [key, value] of Object.entries(data)) {
			result[key] = String(value);
		}
		return result;
	}
}
