import {logStringifySemicolonConfig, parseSemicolonConfig, stringifySemicolonConfig} from '../lib/semicolonUtils';
import {type IConfigParser} from '../interfaces/IConfigParser';
import {type ShowValueType} from '../lib';
import {type ValidateCallback} from '../interfaces/IValidate';

/**
 * The base type of the parsed JSON object
 */
export type RawConfigParseType = Record<string, string>;

export type OutConfigParseType = Record<string, unknown>;

export interface SemicolonConfigParserOptions<
	OutType extends OutConfigParseType = OutConfigParseType,
	RawType extends RawConfigParseType = RawConfigParseType,
> {
	keysToHide?: (keyof OutType)[];
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
	private keysToHide: (keyof Out)[] | undefined;
	private validate: ValidateCallback<Out, RawType> | undefined;
	private keepCase: boolean;
	private showValue: ShowValueType | undefined;

	constructor({keepCase, keysToHide, validate, showValue}: SemicolonConfigParserOptions<Out> = {}) {
		this.keysToHide = keysToHide;
		this.validate = validate;
		this.keepCase = keepCase ?? true;
		this.showValue = showValue;
	}

	public parse(key: string, value: string): Promise<RawType> {
		return Promise.resolve(parseSemicolonConfig(value, this.keepCase) as RawType);
	}

	public async postValidate(key: string, value: RawType): Promise<Out | undefined> {
		return await this.validate?.(value);
	}

	public toString(value: Out): string {
		return stringifySemicolonConfig(value);
	}

	public toLogString(value: Out): string {
		return logStringifySemicolonConfig(value, this.showValue, this.keysToHide);
	}
}
