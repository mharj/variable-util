import {type EncodeOptions, type IConfigParser, type ParserProps, type PostValidateProps} from '../interfaces/IConfigParser';
import {type ValidateCallback} from '../interfaces/IValidate';
import {type ShowValueType} from '../lib';
import {logStringifySemicolonConfig, parseSemicolonConfig, stringifySemicolonConfig} from '../lib/semicolonUtils';

/**
 * The base type of the parsed JSON object
 */
export type RawConfigParseType = Record<string, string>;

export type OutConfigParseType = Record<string, unknown>;

export interface SemicolonConfigParserOptions<
	OutType extends OutConfigParseType = OutConfigParseType,
	RawType extends RawConfigParseType = RawConfigParseType,
> {
	keysToHide?: Iterable<keyof OutType>;
	validate?: ValidateCallback<OutType, RawType>;
	showValue?: ShowValueType;
	/**
	 * keep case of keys, if set as false then will convert keys first letters to lower case (Js Style)
	 */
	keepCase?: boolean;
}

/**
 * A parser for semicolon separated string as config
 * @implements {IConfigParser<Out, RawType>}
 * @category Parsers
 * @since v0.9.0
 */
export class SemicolonConfigParser<Out extends OutConfigParseType = OutConfigParseType, RawType extends RawConfigParseType = RawConfigParseType>
	implements IConfigParser<Out, RawType>
{
	public name = 'semicolonConfigParser';
	private keysToHide: Set<keyof Out>;
	private validate: ValidateCallback<Out, RawType> | undefined;
	private keepCase: boolean;
	private showValue: ShowValueType | undefined;

	constructor({keepCase, keysToHide, validate, showValue}: SemicolonConfigParserOptions<Out> = {}) {
		this.keysToHide = new Set(keysToHide);
		this.validate = validate;
		this.keepCase = keepCase ?? true;
		this.showValue = showValue;
	}

	public parse({value}: ParserProps): Promise<RawType> {
		return Promise.resolve(parseSemicolonConfig(value, this.keepCase) as RawType);
	}

	public async postValidate({value}: PostValidateProps<RawType>): Promise<Out | undefined> {
		return await this.validate?.(value);
	}

	public toString(value: Out, options?: EncodeOptions): string {
		return stringifySemicolonConfig(value, options?.uriEncode);
	}

	public toLogString(value: Out): string {
		return logStringifySemicolonConfig(value, this.showValue, this.keysToHide);
	}
}
