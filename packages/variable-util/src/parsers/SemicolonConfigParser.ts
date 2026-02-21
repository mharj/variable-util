import type {EncodeOptions, IConfigParser, ParserProps, PostValidateProps} from '../interfaces/IConfigParser';
import type {ValidateCallback} from '../interfaces/IValidate';
import type {ShowValueType} from '../lib';
import {logStringifySemicolonConfig, parseSemicolonConfig, stringifySemicolonConfig} from '../lib/semicolonUtils';

/**
 * SemicolonConfigParserOptions is the interface for SemicolonConfigParser options
 * @category Parsers
 * @since v1.0.0
 * @template OutType - the type of the output object
 */
export interface SemicolonConfigParserOptions<OutType extends Record<string, unknown> = Record<string, unknown>> {
	validate?: ValidateCallback<Record<string, string>, OutType>;
	/** keys to hide or partially hide */
	protectedKeys?: Iterable<keyof OutType>;
	/** if and how to show protected keys */
	showProtectedKeys?: ShowValueType;
	/** keep case of keys, if set as false then will convert keys first letters to lower case (Js Style) */
	keepCase?: boolean;
}

/**
 * Config parser to parse semicolon separated string key=value pairs as object
 * @example
 * const objectSchema = z.object({
 *   foo: z.string(),
 *   baz: z.string(),
 *   secret: z.string(),
 * });
 * // parses 'foo=bar;baz=qux;secret=secret' string to {foo: "bar", baz: "qux", secret: "secret"}
 * const fooBarJsonParser = new SemicolonConfigParser({
 *   validate: (value) => objectSchema.parse(value),
 *   protectedKeys: ['secret'],
 *   showProtectedKeys: 'prefix-suffix', // shows secret value with few characters from start and end on logging
 * });
 * @template Out - the type of the output object
 * @implements {IConfigParser<Out, Record<string, string>>}
 * @category Parsers
 * @since v1.0.0
 */
export class SemicolonConfigParser<Out extends Record<string, unknown> = Record<string, unknown>> implements IConfigParser<Record<string, string>, Out> {
	public name = 'semicolonConfigParser';
	private validate: ValidateCallback<Record<string, string>, Out> | undefined;
	private keepCase: boolean;
	private showProtectedKeys: ShowValueType | undefined;
	private protectedKeys: Set<keyof Out>;

	public constructor({keepCase, protectedKeys, validate, showProtectedKeys}: SemicolonConfigParserOptions<Out> = {}) {
		this.protectedKeys = new Set(protectedKeys);
		this.validate = validate;
		this.keepCase = keepCase ?? true;
		this.showProtectedKeys = showProtectedKeys;
	}

	public parse({value}: ParserProps): Promise<Record<string, string>> {
		return Promise.resolve(parseSemicolonConfig(value, this.keepCase));
	}

	public async postValidate({value}: PostValidateProps<Record<string, string>>): Promise<Out | undefined> {
		return await this.validate?.(value);
	}

	public toString(config: Out, options?: EncodeOptions): string {
		return stringifySemicolonConfig(config, options?.uriEncode);
	}

	public toLogString(config: Out): string {
		return logStringifySemicolonConfig(config, this.showProtectedKeys, this.protectedKeys);
	}
}
