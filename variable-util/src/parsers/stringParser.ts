import {IConfigParser} from '../interfaces/IConfigParser';

/**
 * String parser function is used to parse and validate env variables of type string.
 * @implements {IConfigParser<string, string>}
 * @category Parsers
 */
export const stringParser: IConfigParser<string, string> = {
	name: 'stringParser',
	parse: async (_key: string, value: string): Promise<string> => {
		return value;
	},
	preValidate: async (key: string, value: string): Promise<void> => {
		if (typeof value !== 'string') {
			throw new TypeError(`value for key ${key} is not a string`);
		}
	},
	toString: (value: string): string => {
		return value;
	},
};
