import {ShowValueType, buildHiddenValue} from '../lib/formatUtils';
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
	private keysToHide: (keyof Out)[];
	private validate: ValidateCallback<Out, JsonParseType> | undefined;
	private showValue?: ShowValueType;

	constructor({
		keysToHide,
		validate,
		showValue,
	}: {keysToHide?: (keyof Out)[]; validate?: ValidateCallback<Out, JsonParseType>; showValue?: ShowValueType} = {}) {
		this.keysToHide = keysToHide || [];
		this.validate = validate;
		this.showValue = showValue;
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
						last[`${key}`] = buildHiddenValue(`${value}`, this.showValue);
					}
				}
				return last;
			}, {}),
		);
	}
}
