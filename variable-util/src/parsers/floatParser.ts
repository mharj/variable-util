import {IConfigParser, PostValidate} from '../interfaces/IConfigParser';
import {getFloat} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to number
 * @param {PostValidate<Output, number>} [postValidate] - optional post validation
 * @returns {IConfigParser<Output, number>}
 * @category Parsers
 */
export function floatParser<Output extends number = number>(postValidate?: PostValidate<Output, number>): IConfigParser<Output, number> {
	return {
		name: 'floatParser',
		parse: async (key: string, value: string): Promise<number> => {
			return getFloat(value).unwrap(() => new TypeError(`value for key ${key} is not a float string`));
		},
		postValidate,
		preValidate: async (key: string, value: string): Promise<void> => {
			if (typeof value !== 'string') {
				throw new TypeError(`value for key ${key} is not a string`);
			}
		},
		toString: (value: number): string => {
			return value.toString();
		},
	};
}
