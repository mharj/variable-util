import {IConfigParser} from '../interfaces/IConfigParser';
import {ValidateCallback} from '../interfaces/IValidate';

/**
 * The base type of the parsed JSON object
 */
export type JsonParseType = Record<string, unknown>;

/**
 * A parser for JSON sting as config
 * @implements {IConfigParser<Out, JsonParseType>}
 * @category Parsers
 */
export class JsonConfigParser<Out extends JsonParseType> implements IConfigParser<Out, JsonParseType> {
	public name = 'jsonConfigParser';
	private keysToHide: string[] | undefined;
	private validate: ValidateCallback<Out, JsonParseType> | undefined;

	constructor({keysToHide, validate}: {keysToHide?: string[]; validate?: ValidateCallback<Out, JsonParseType>} = {}) {
		this.keysToHide = keysToHide;
		this.validate = validate;
	}

	public parse(key: string, value: string): Promise<JsonParseType> {
		return Promise.resolve(JSON.parse(value));
	}

	public async postValidate(key: string, value: JsonParseType): Promise<Out | undefined> {
		return await this.validate?.(value);
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
