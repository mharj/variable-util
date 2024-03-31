import {AbstractFileRecordLoader, AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';
import {parse} from 'dotenv';

/**
 * Loader for dotenv files, using the `dotenv` packages parser.
 */
export class DotEnvLoader extends AbstractFileRecordLoader {
	public readonly type = 'dotenv';
	protected defaultOptions: AbstractFileRecordLoaderOptions<'env'> = {
		disabled: false,
		fileName: '.env',
		fileType: 'env',
		isSilent: true,
		logger: undefined,
		validate: undefined,
		watch: false,
	};

	protected handleParse(rawData: Buffer): Record<string, string | undefined> {
		return parse(rawData);
	}
}
