import {IConfigParser, PostValidate} from '../interfaces/IConfigParser';
import {getBoolean} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 *
 * supports the following string ___true___ values:
 *
 * ```['true', '1', 'yes', 'y', 'on']```
 *
 * supports the following string ___false___ values:
 *
 * ```['false', '0', 'no', 'n', 'off']```
 * @template Output - Type of output, defaults to number
 * @param {PostValidate<Output, number>} [postValidate] - optional post validation
 * @returns {IConfigParser<Output, number>}
 * @category Parsers
 */
export function booleanParser<Output extends boolean = boolean>(postValidate?: PostValidate<Output, boolean>): IConfigParser<Output, boolean> {
	return {
		name: 'booleanParser',
		parse: async (key: string, value: string): Promise<boolean> => {
			return getBoolean(value).unwrap(() => new TypeError(`value for key ${key} is not a boolean string`));
		},
		postValidate,
		preValidate: async (key: string, value: string): Promise<void> => {
			if (typeof value !== 'string') {
				throw new TypeError(`value for key ${key} is not a string`);
			}
		},
		toString: (value: boolean): string => {
			return value ? 'true' : 'false';
		},
	};
}
