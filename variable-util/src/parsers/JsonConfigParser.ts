import {IConfigParser} from '../interfaces/IConfigParser';
import {ValidateCallback} from '../interfaces/IValidate';
import {buildHiddenValueString} from '../lib/formatUtils';

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
	private keysToHide: (keyof Out)[];
	private validate: ValidateCallback<Out, JsonParseType> | undefined;

	constructor({keysToHide, validate}: {keysToHide?: (keyof Out)[]; validate?: ValidateCallback<Out, JsonParseType>} = {}) {
		this.keysToHide = keysToHide || [];
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
				if (value) {
					last[`${key}`] = value;
				}
				return last;
			}, {}),
		);
	}

	public toLogString(value: Out): string {
		return JSON.stringify(
			Object.entries(value).reduce<Record<string, unknown>>((last, [key, value]) => {
				if (value) {
					if (!this.keysToHide.includes(key)) {
						last[`${key}`] = value;
					} else {
						last[`${key}`] = buildHiddenValueString(`${value}`);
					}
				}
				return last;
			}, {}),
		);
	}
}
