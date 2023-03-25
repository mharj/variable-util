import {ValidateCallback, IValidateResponse} from '../interfaces/IValidate';
import {IConfigParser} from '../interfaces/IConfigParser';

export class JsonConfigParser<Out extends Record<string, unknown>> implements IConfigParser<Out> {
	public name = 'jsonConfigParser';
	private keysToHide: string[] | undefined;
	private validate: ValidateCallback<Out> | undefined;

	constructor({keysToHide, validate}: {keysToHide?: string[]; validate?: ValidateCallback<Out>} = {}) {
		this.keysToHide = keysToHide;
		this.validate = validate;
	}

	public parse(key: string, value: string): Promise<Out> {
		return JSON.parse(value);
	}

	public async postValidate(key: string, value: Out): Promise<IValidateResponse> {
		return (await this.validate?.(value)) || {success: true};
	}

	public toString(value: Out): string {
		return JSON.stringify(
			Object.entries(value).reduce<Record<string, unknown>>((last, [key, value]) => {
				if (value && (this.keysToHide === undefined || !this.keysToHide.includes(key))) {
					last[`${key}`] = value;
				}
				return last;
			}, {}),
		);
	}
}
