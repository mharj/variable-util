import {IConfigParser, PostValidate} from '../interfaces/IConfigParser';
import {getString} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to string
 * @param {PostValidate<Output, string>} [postValidate] - optional post validation
 * @returns {IConfigParser<Output, string>}
 * @category Parsers
 */
export function stringParser<Output extends string = string>(postValidate?: PostValidate<Output, string>): IConfigParser<Output, string> {
	return {
		name: 'stringParser',
		parse: async (key: string, value: string): Promise<string> => {
			return getString(value).unwrap(() => new TypeError(`value for key ${key} is not a string`));
		},
		postValidate,
		preValidate: async (key: string, value: string): Promise<void> => {
			if (typeof value !== 'string') {
				throw new TypeError(`value for key ${key} is not a string`);
			}
		},
		toString: (value: string): string => {
			return value;
		},
	};
}
