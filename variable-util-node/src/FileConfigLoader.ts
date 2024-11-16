import {AbstractFileRecordLoader, type AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';
import {type Loadable} from '@avanio/variable-util';

/**
 * A file-based configuration loader that reads a JSON file.
 * @since v0.9.1
 */
export class FileConfigLoader extends AbstractFileRecordLoader<AbstractFileRecordLoaderOptions<'json'>> {
	public readonly type: Lowercase<string>;

	public constructor(options: Loadable<Partial<AbstractFileRecordLoaderOptions<'json'>>>, type: Lowercase<string> = 'file') {
		super(options);
		this.type = type;
	}

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
