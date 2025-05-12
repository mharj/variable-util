import {type IConfigParser, type ParserProps, type TypeGuardValidate} from '../interfaces';

/**
 * Build parser for array of values
 * @template Input - Type of input
 * @template Output - Type of output
 * @param {IConfigParser<Input, Output>} parse parser for the array values
 * @param {string} separator separator for the array values, defaults to ';'
 * @param {TypeGuardValidate<Output> | undefined} validate optional post validation
 * @returns {IConfigParser<Output[], Input[]>} Parser for array of values
 * @category Parsers
 * @since v1.0.0
 */
export function arrayParser<Input, Output>(
	parse: IConfigParser<Input, Output>,
	separator = ';',
	validate?: TypeGuardValidate<Output>,
): IConfigParser<Input[], Output[]> {
	return {
		name: 'arraySeparatorParser',
		parse: (props: ParserProps) => {
			return Promise.all(props.value.split(separator).map((v) => parse.parse({...props, value: v})));
		},
		postValidate: async (props) => {
			if (!validate) {
				return undefined;
			}
			const valueList = await Promise.all(
				props.value.map(async (v) => {
					if (!(await validate)?.(v)) {
						return undefined;
					}
					return v;
				}),
			);
			return valueList.filter((v) => v !== undefined);
		},
		toString: (value: Output[]) => {
			return value.map((v) => parse.toString(v)).join(separator);
		},
	};
}
