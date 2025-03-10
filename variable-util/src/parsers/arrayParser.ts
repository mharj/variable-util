import {type IConfigParser, type ParserProps, type PostValidate} from '../interfaces';

/**
 * Build parser for array of values
 * @param parse parser for the array values
 * @param separator separator for the array values, defaults to ';'
 * @param postValidate optional post validation
 * @returns {IConfigParser<Output[], RawOutput[]>} Parser for array of values
 * @category Parsers
 * @since v0.9.1
 */
export function arrayParser<Output, RawOutput>(
	parse: IConfigParser<Output, RawOutput>,
	separator = ';',
	postValidate?: PostValidate<Output[], RawOutput[]>,
): IConfigParser<Output[], RawOutput[]> {
	return {
		name: 'arraySeparatorParser',
		parse: (props: ParserProps) => {
			return Promise.all(props.value.split(separator).map((v) => parse.parse({...props, value: v})));
		},
		postValidate,
		toString: (value: Output[]) => {
			return value.map((v) => parse.toString(v)).join(separator);
		},
	};
}
