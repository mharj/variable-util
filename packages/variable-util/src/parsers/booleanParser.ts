import type {IConfigParser, ParserProps, TypeGuardValidate} from '../interfaces/IConfigParser';
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
 * @param {TypeGuardValidate<Output>} [validate] - optional post validation
 * @returns {IConfigParser<boolean, Output>} - parser
 * @category Parsers
 * @since v1.0.0
 */
export function booleanParser<Output extends boolean = boolean>(validate?: TypeGuardValidate<Output>): IConfigParser<boolean, Output> {
	return {
		name: 'booleanParser',
		parse: ({key, value}: ParserProps) => {
			return getBoolean(value)
				.mapErr((cause) => new TypeError(`value for key ${key} is not a boolean string`, {cause}))
				.unwrap();
		},
		postValidate: async ({value}) => {
			if ((await validate?.(value)) === false) {
				return undefined;
			}
			return value as Output;
		},
		toString: (value: boolean): string => {
			return value.toString();
		},
	};
}
