import {IConfigParser} from '../interfaces/IConfigParser';

/**
 * Integer parser function is used to parse and validate env variables of type integer.
 * @implements {IConfigParser<number, number>}
 * @category Parsers
 */
export const integerParser: IConfigParser<number, number> = {
	name: 'integerParser',
	parse: async (key: string, value: string): Promise<number> => {
		if (typeof value !== 'string') {
			throw new TypeError(`value for key ${key} is not a string`);
		}
		const output = parseInt(value, 10);
		if (isNaN(output)) {
			throw new TypeError(`value for key ${key} is not a valid integer`);
		}
		return output;
	},
	toString: (value: number): string => {
		return `${value}`;
	},
};
