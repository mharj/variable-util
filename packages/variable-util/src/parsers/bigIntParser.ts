import type {IConfigParser, ParserProps, TypeGuardValidate} from '../interfaces';
import {getBigInt} from '../lib/primitiveUtils';

/**
 * Build parser and have optional post validation (as example for literal values)
 * @template Output - Type of output, defaults to bigint
 * @param {TypeGuardValidate<Output>} [validate] - optional post validation
 * @returns {IConfigParser<bigint, Output>} - parser
 * @category Parsers
 * @since v1.0.0
 */
export function bigIntParser<Output extends bigint = bigint>(validate?: TypeGuardValidate<Output>): IConfigParser<bigint, Output> {
	return {
		name: 'bigIntParser',
		parse: ({key, value}: ParserProps) => {
			return getBigInt(value)
				.mapErr((cause) => new TypeError(`value for key ${key} is not an integer string`, {cause}))
				.unwrap();
		},
		postValidate: async (props) => {
			if (!(await validate)?.(props.value)) {
				return undefined;
			}
			return props.value;
		},
		toString: (value: bigint): string => {
			return value.toString();
		},
	};
}
