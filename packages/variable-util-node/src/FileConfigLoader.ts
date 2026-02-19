import type {OverrideKeyMap} from '@avanio/variable-util';
import {type Loadable, UndefCore} from '@luolapeikko/ts-common';
import {AbstractFileRecordLoader, type AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';

/**
 * A file-based configuration loader that reads a JSON file.
 * @template OverrideMap Type of the override keys
 * @since v1.0.0
 */
export class FileConfigLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends AbstractFileRecordLoader<
	AbstractFileRecordLoaderOptions<'json'>,
	OverrideMap
> {
	public readonly loaderType: Lowercase<string>;

	protected defaultOptions: AbstractFileRecordLoaderOptions<'json'> = {
		disabled: false,
		fileName: 'config.json',
		fileType: 'json',
		isSilent: true,
		logger: undefined,
		validate: undefined,
		watch: false,
	};

	public constructor(
		options: Loadable<Partial<AbstractFileRecordLoaderOptions<'json'>>>,
		overrideKeys?: Partial<OverrideMap>,
		type: Lowercase<string> = 'file',
	) {
		super(options, overrideKeys);
		this.loaderType = type;
	}

	protected handleParse(rawData: Buffer, options: AbstractFileRecordLoaderOptions<'json'>): Record<string, string | undefined> {
		const data: unknown = JSON.parse(rawData.toString());
		if (typeof data !== 'object' || data === null || Array.isArray(data)) {
			options.logger?.error(`ConfigVariables[${this.loaderType}]: Invalid JSON data from ${options.fileName}`);
			return {};
		}
		return this.convertObjectToStringRecord(data);
	}

	/**
	 * Converts an object to a record of strings as env values are always strings.
	 * @param {object} data The object to convert
	 * @returns {Record<string, string>} The converted object
	 */
	private convertObjectToStringRecord(data: object): Record<string, string> {
		return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
			if (UndefCore.isNotNullish(value)) {
				acc[key] = String(value);
			}
			return acc;
		}, {});
	}
}
