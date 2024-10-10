import {type IConfigParser, type PostValidate} from '../interfaces/IConfigParser';
import {getString} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to string
 * @param {PostValidate<Output, string>} [postValidate] - optional post validation
 * @returns {IConfigParser<Output, string>}
 * @category Parsers
 * @since v0.3.0
 */
export function stringParser<Output extends string = string>(postValidate?: PostValidate<Output, string>): IConfigParser<Output, string> {
	return {
		name: 'stringParser',
		parse: (key: string, value: string) => {
			return getString(value).unwrap(() => new TypeError(`value for key ${key} is not a string`));
		},
		postValidate,
		preValidate: (key: string, value: string) => {
			if (typeof value !== 'string') {
				throw new TypeError(`value for key ${key} is not a string`);
			}
		},
		toString: (value: string): string => {
			return value;
		},
	};
}
