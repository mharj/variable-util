import {ValidateCallback, IValidateResponse} from '../interfaces/IValidate';
import {IConfigParser} from '../interfaces/IConfigParser';
import {parseSemicolonConfig, stringifySemicolonConfig} from '../lib/semicolonUtils';

interface SemicolonConfigParserOptions<Out extends Record<string, string | undefined>> {
	keysToHide?: string[];
	validate?: ValidateCallback<Out>;
	/**
	 * keep case of keys, if set as false then will convert keys first letters to lower case (Js Style)
	 */
	keepCase?: boolean;
}

export class SemicolonConfigParser<Out extends Record<string, string | undefined>> implements IConfigParser<Out> {
	public name = 'semicolonConfigParser';
	private keysToHide: string[] | undefined;
	private validate: ValidateCallback<Out> | undefined;
	private keepCase: boolean;

	constructor({keepCase, keysToHide, validate}: SemicolonConfigParserOptions<Out> = {}) {
		this.keysToHide = keysToHide;
		this.validate = validate;
		this.keepCase = keepCase ?? true;
	}

	public parse(key: string, value: string): Promise<Out> {
		return Promise.resolve(parseSemicolonConfig(value, this.keepCase) as Out);
	}

	public async postValidate(key: string, value: Out): Promise<IValidateResponse> {
		return (await this.validate?.(value)) || {success: true};
	}

	public toString(value: Out): string {
		return stringifySemicolonConfig(value, this.keysToHide);
	}
}
