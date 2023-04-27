import {parseSemicolonConfig, stringifySemicolonConfig} from '../lib/semicolonUtils';
import {IConfigParser} from '../interfaces/IConfigParser';
import {ValidateCallback} from '../interfaces/IValidate';

type ConfigParseType = Record<string, string>;

interface SemicolonConfigParserOptions<Out extends ConfigParseType = ConfigParseType, RawType extends ConfigParseType = ConfigParseType> {
	keysToHide?: string[];
	validate?: ValidateCallback<Out, RawType>;
	/**
	 * keep case of keys, if set as false then will convert keys first letters to lower case (Js Style)
	 */
	keepCase?: boolean;
}

export class SemicolonConfigParser<Out extends ConfigParseType = ConfigParseType, RawType extends ConfigParseType = ConfigParseType>
	implements IConfigParser<Out, RawType>
{
	public name = 'semicolonConfigParser';
	private keysToHide: string[] | undefined;
	private validate: ValidateCallback<Out, RawType> | undefined;
	private keepCase: boolean;

	constructor({keepCase, keysToHide, validate}: SemicolonConfigParserOptions<Out> = {}) {
		this.keysToHide = keysToHide;
		this.validate = validate;
		this.keepCase = keepCase ?? true;
	}

	public parse(key: string, value: string): Promise<RawType> {
		return Promise.resolve(parseSemicolonConfig(value, this.keepCase) as RawType);
	}

	public async postValidate(key: string, value: RawType): Promise<Out | undefined> {
		return await this.validate?.(value);
	}

	public toString(value: Out): string {
		return stringifySemicolonConfig(value, this.keysToHide);
	}
}
