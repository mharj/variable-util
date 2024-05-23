import {IConfigParser, PostValidate} from '../interfaces';

/**
 * Build parser for array of values
 * @param parse parser for the array values
 * @param separator separator for the array values, defaults to ';'
 * @param postValidate optional post validation
 * @returns {IConfigParser<Output[], RawOutput[]>} Parser for array of values
 * @category Parsers
 */
export function arrayParser<Output, RawOutput>(
	parse: IConfigParser<Output, RawOutput>,
	separator: ';' = ';',
	postValidate?: PostValidate<Output[], RawOutput[]>,
): IConfigParser<Output[], RawOutput[]> {
	return {
		name: 'semicolonArrayParser',
		parse: (key: string, value: string): Promise<RawOutput[]> => {
			return Promise.all(value.split(separator).map((v) => parse.parse(key, v)));
		},
		postValidate,
		toString: (value: Output[]): string => {
			return value.map((v) => parse.toString(v)).join(separator);
		},
	};
}
