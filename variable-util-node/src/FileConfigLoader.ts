import {AbstractFileRecordLoader, AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';

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
		return JSON.parse(rawData.toString());
	}
}
