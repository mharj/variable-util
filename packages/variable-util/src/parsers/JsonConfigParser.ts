import type {IConfigParser, ParserProps, PostValidateProps} from '../interfaces/IConfigParser';
import type {ValidateCallback} from '../interfaces/IValidate';
import {buildHiddenValue, type ShowValueType} from '../lib/formatUtils';

export type JsonConfigParserOptions<Out extends Record<string, unknown>> = {
	validate?: ValidateCallback<object, Out>;
	/** keys to hide or partially hide */
	protectedKeys?: Iterable<keyof Out>;
	/** if and how to show protected keys */
	showProtectedKeys?: ShowValueType;
};

/**
 * Config parser to parse JSON string as object
 * @example
 * const objectSchema = z.object({
 *   foo: z.string(),
 *   baz: z.string(),
 *   secret: z.string(),
 * });
 * // parses '{"foo": "bar", "baz": "qux", "secret": "secret"}' string to {foo: "bar", baz: "qux", secret: "secret"}
 * const fooBarJsonParser = new JsonConfigParser({
 *   validate: (value) => objectSchema.parse(value),
 *   protectedKeys: ['secret'],
 *   showProtectedKeys: 'prefix-suffix', // shows secret value with few characters from start and end on logging
 * });
 * @template Out - the type of the output object
 * @implements {IConfigParser<Out, object>}
 * @category Parsers
 * @since v1.0.0
 */
export class JsonConfigParser<Out extends Record<string, unknown>> implements IConfigParser<object, Out> {
	public name = 'jsonConfigParser';
	private validate: ValidateCallback<object, Out> | undefined;
	private showProtectedKeys?: ShowValueType;
	private protectedKeys: Set<keyof Out>;

	public constructor({protectedKeys, validate, showProtectedKeys}: JsonConfigParserOptions<Out> = {}) {
		this.protectedKeys = new Set(protectedKeys);
		this.validate = validate;
		this.showProtectedKeys = showProtectedKeys;
	}

	public parse({value}: ParserProps): object {
		return this.buildBaseRecord(JSON.parse(value));
	}

	public async postValidate({value}: PostValidateProps<Record<string, unknown>>): Promise<Out | undefined> {
		return await this.validate?.(value);
	}

	public toString(config: Out): string {
		return JSON.stringify(
			Object.entries(config).reduce<Record<string, unknown>>((last, [key, value]) => {
				if (value) {
					last[key] = value;
				}
				return last;
			}, {}),
		);
	}

	public toLogString(config: Out): string {
		return JSON.stringify(
			Object.entries(config).reduce<Record<string, unknown>>((last, [key, value]) => {
				if (value) {
					if (this.protectedKeys.has(key)) {
						last[key] = buildHiddenValue(String(value), this.showProtectedKeys);
					} else {
						last[key] = value;
					}
				}
				return last;
			}, {}),
		);
	}

	/**
	 * Build a string record from the given data
	 * @param {unknown} data - to be validated as object
	 * @returns {object} A record with string values
	 */
	private buildBaseRecord(data: unknown): object {
		if (typeof data !== 'object' || data === null || Array.isArray(data)) {
			return {};
		}
		return data;
	}
}
