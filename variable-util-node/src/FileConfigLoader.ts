import {AbstractFileRecordLoader, type AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';

/**
 * A file-based configuration loader that reads a JSON file.
 * @since v0.9.1
 */
export class FileConfigLoader extends AbstractFileRecordLoader<AbstractFileRecordLoaderOptions<'json'>> {
	public readonly type = 'file';
	protected defaultOptions: AbstractFileRecordLoaderOptions<'json'> = {
		disabled: false,
		fileName: 'config.json',
		fileType: 'json',
		isSilent: true,
		logger: undefined,
		validate: undefined,
		watch: false,
	};

	protected handleParse(rawData: Buffer): Record<string, string | undefined> {
		return JSON.parse(rawData.toString()) as Record<string, string | undefined>;
	}
}
