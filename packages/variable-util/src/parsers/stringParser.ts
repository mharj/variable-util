import type {IConfigParser, ParserProps, PreValidateProps, TypeGuardValidate} from '../interfaces/IConfigParser';
import {getString} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to string
 * @param {TypeGuardValidate<Output>} [validate] - optional post validation
 * @returns {IConfigParser<string, Output>} - parser
 * @category Parsers
 * @since v1.0.0
 */
export function stringParser<Output extends string = string>(validate?: TypeGuardValidate<Output>): IConfigParser<string, Output> {
	return {
		name: 'stringParser',
		parse: ({value, key}: ParserProps) => {
			return getString(value)
				.mapErr((cause) => new TypeError(`value for key ${key} is not a string`, {cause}))
				.unwrap();
		},
		postValidate: async (props) => {
			if (!(await validate)?.(props.value)) {
				return undefined;
			}
			return props.value;
		},
		preValidate: ({key, value}: PreValidateProps) => {
			if (typeof value !== 'string') {
				throw new TypeError(`value for key ${key} is not a string`);
			}
		},
		toString: (value: string): string => {
			return value;
		},
	};
}
