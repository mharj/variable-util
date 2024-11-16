import {type IConfigParser, type ParserProps, type PostValidate, type PreValidateProps} from '../interfaces/IConfigParser';
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
 * @since v0.3.0
 */
export function booleanParser<Output extends boolean = boolean>(postValidate?: PostValidate<Output, boolean>): IConfigParser<Output, boolean> {
	return {
		name: 'booleanParser',
		parse: ({key, value}: ParserProps) => {
			return getBoolean(value).unwrap(() => new TypeError(`value for key ${key} is not a boolean string`));
		},
		postValidate,
		preValidate: ({key, value}: PreValidateProps) => {
			// allow boolean values to be passed in as getBoolean can handle them
			if (typeof value === 'boolean') {
				return;
			}
			if (typeof value !== 'string') {
				throw new TypeError(`value for key ${key} is not a string`);
			}
		},
		toString: (value: boolean): string => {
			return value ? 'true' : 'false';
		},
	};
}
