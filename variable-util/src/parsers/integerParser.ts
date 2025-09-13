import {type IConfigParser, type ParserProps, type TypeGuardValidate} from '../interfaces/IConfigParser';
import {getInteger} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to number
 * @param {TypeGuardValidate<Output>} [validate] - optional post validation
 * @returns {IConfigParser<number, Output>} - parser
 * @category Parsers
 * @since v1.0.0
 */
export function integerParser<Output extends number = number>(validate?: TypeGuardValidate<Output>): IConfigParser<number, Output> {
	return {
		name: 'integerParser',
		parse: ({key, value}: ParserProps) => {
			return getInteger(value)
				.mapErr((cause) => new TypeError(`value for key ${key} is not an integer string`, {cause}))
				.unwrap();
		},
		postValidate: async (props) => {
			if (!(await validate)?.(props.value)) {
				return undefined;
			}
			return props.value;
		},
		toString: (value: number): string => {
			return value.toString();
		},
	};
}
