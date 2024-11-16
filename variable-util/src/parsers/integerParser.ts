import {type IConfigParser, type ParserProps, type PostValidate} from '../interfaces/IConfigParser';
import {getInteger} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to number
 * @param {PostValidate<Output, number>} [postValidate] - optional post validation
 * @returns {IConfigParser<Output, number>}
 * @category Parsers
 * @since v0.3.0
 */
export function integerParser<Output extends number = number>(postValidate?: PostValidate<Output, number>): IConfigParser<Output, number> {
	return {
		name: 'integerParser',
		parse: ({key, value}: ParserProps) => {
			return getInteger(value).unwrap(() => new TypeError(`value for key ${key} is not an integer string`));
		},
		postValidate,
		toString: (value: number): string => {
			return String(value);
		},
	};
}
