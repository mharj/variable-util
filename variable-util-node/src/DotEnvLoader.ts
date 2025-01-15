import {type Loadable} from '@luolapeikko/ts-common';
import {parse} from 'dotenv';
import {AbstractFileRecordLoader, type AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';

/**
 * Loader for dotenv files, using the `dotenv` packages parser.
 * @since v0.6.1
 */
export class DotEnvLoader extends AbstractFileRecordLoader {
	public readonly type: Lowercase<string>;

	protected defaultOptions: AbstractFileRecordLoaderOptions<'env'> = {
		disabled: false,
		fileName: '.env',
		fileType: 'env',
		isSilent: true,
		logger: undefined,
		validate: undefined,
		watch: false,
	};

	public constructor(options: Loadable<Partial<AbstractFileRecordLoaderOptions<'env'>>>, type: Lowercase<string> = 'dotenv') {
		super(options);
		this.type = type;
	}

	protected handleParse(rawData: Buffer): Record<string, string | undefined> {
		return parse(rawData);
	}
}
