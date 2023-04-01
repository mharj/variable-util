import {IConfigParser} from '../interfaces/IConfigParser';

export const stringParser: IConfigParser<string, string> = {
	name: 'stringParser',
	parse: async (key: string, value: string): Promise<string> => {
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
