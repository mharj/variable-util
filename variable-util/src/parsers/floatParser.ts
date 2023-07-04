import {IConfigParser} from '../interfaces/IConfigParser';

/**
 * Float parser function is used to parse and validate env variables of type float.
 * @implements {IConfigParser<number, number>}
 * @category Parsers
 */
export const floatParser: IConfigParser<number, number> = {
	name: 'floatParser',
	parse: async (key: string, value: string): Promise<number> => {
		return Promise.resolve(parseFloat(value));
	},
	preValidate: async (key: string, value: string): Promise<void> => {
		if (typeof value !== 'string') {
			throw new TypeError(`value for key ${key} is not a string`);
		}
		if (isNaN(parseFloat(value))) {
			throw new TypeError(`value for key ${key} is not a valid float`);
		}
	},
	toString: (value: number): string => {
		return value.toString();
	},
};
