import type {OverrideKeyMap} from '@avanio/variable-util';
import {parse} from 'dotenv';
import {AbstractFileRecordLoader, type AbstractFileRecordLoaderOptions} from './AbstractFileRecordLoader';

type Opts = Partial<AbstractFileRecordLoaderOptions<'env'>>;
/**
 * Loader for dotenv files, using the `dotenv` packages parser.
 * @template OverrideMap Type of the override keys
 * @since v1.0.0
 */
export class DotEnvLoader<OverrideMap extends OverrideKeyMap = OverrideKeyMap> extends AbstractFileRecordLoader<
	AbstractFileRecordLoaderOptions<string>,
	OverrideMap
> {
	public readonly loaderType: Lowercase<string>;

	protected defaultOptions: AbstractFileRecordLoaderOptions<'env'> = {
		disabled: false,
		fileName: '.env',
		fileType: 'env',
		isSilent: true,
		logger: undefined,
		validate: undefined,
		watch: false,
	};

	public constructor(options: Opts | Promise<Opts> | (() => Opts | Promise<Opts>), overrideKeys?: Partial<OverrideMap>, type: Lowercase<string> = 'dotenv') {
		super(options, overrideKeys);
		this.loaderType = type;
	}

	protected handleParse(rawData: Buffer): Record<string, string | undefined> {
		return parse(rawData);
	}
}
