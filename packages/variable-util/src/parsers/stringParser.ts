import type {IConfigParser, ParserProps, TypeGuardValidate} from '../interfaces/IConfigParser';
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
		parse: ({value, key}: ParserProps): string => {
			return getString(value)
				.mapErr((cause) => new TypeError(`value for key ${key} is not a string`, {cause}))
				.unwrap();
		},
		postValidate: async ({value}) => {
			if ((await validate?.(value)) === false) {
				return undefined;
			}
			return value as Output;
		},
		toString: (value: string): string => {
			return value;
		},
	} satisfies IConfigParser<string, Output>;
}
