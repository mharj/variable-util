import {type IConfigParser, type ParserProps, type PostValidateProps} from '../interfaces/IConfigParser';
import {type ValidateCallback} from '../interfaces/IValidate';
import {buildHiddenValue, type ShowValueType} from '../lib/formatUtils';

/**
 * The base type of the parsed JSON object
 */
export type JsonParseType = Record<string, unknown>;

/**
 * A parser for JSON sting as config
 * @implements {IConfigParser<Out, JsonParseType>}
 * @category Parsers
 * @since v0.9.0
 */
export class JsonConfigParser<Out extends JsonParseType> implements IConfigParser<Out, JsonParseType> {
	public name = 'jsonConfigParser';
	private keysToHide: Set<keyof Out>;
	private validate: ValidateCallback<Out, JsonParseType> | undefined;
	private showValue?: ShowValueType;

	constructor({
		keysToHide,
		validate,
		showValue,
	}: {keysToHide?: Iterable<keyof Out>; validate?: ValidateCallback<Out, JsonParseType>; showValue?: ShowValueType} = {}) {
		this.keysToHide = new Set(keysToHide);
		this.validate = validate;
		this.showValue = showValue;
	}

	public parse({value}: ParserProps) {
		return JSON.parse(value) as JsonParseType;
	}

	public async postValidate({value}: PostValidateProps<JsonParseType>): Promise<Out | undefined> {
		return await this.validate?.(value);
	}

	public toString(value: Out): string {
		return JSON.stringify(
			Object.entries(value).reduce<Record<string, unknown>>((last, [key, value]) => {
				if (value) {
					last[key] = value;
				}
				return last;
			}, {}),
		);
	}

	public toLogString(value: Out): string {
		return JSON.stringify(
			Object.entries(value).reduce<Record<string, unknown>>((last, [key, value]) => {
				if (value) {
					if (this.keysToHide.has(key)) {
						last[key] = buildHiddenValue(String(value), this.showValue);
					} else {
						last[key] = value;
					}
				}
				return last;
			}, {}),
		);
	}
}
