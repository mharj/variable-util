import {IConfigParser} from '../interfaces/IConfigParser';
import {IValidateResponse} from '../interfaces/IValidate';

export const integerParser: IConfigParser<number> = {
	name: 'integerParser',
	parse: async (key: string, value: string): Promise<number> => {
		return Promise.resolve(parseInt(value, 10));
	},
	preValidate: async (key: string, value: string): Promise<IValidateResponse> => {
		if (typeof value !== 'string') {
			return {success: false, message: `variables: value for key ${key} is not a string`};
		}
		try {
			parseInt(value, 10);
			return {success: true};
		} catch (e) {
			return {success: false, message: e instanceof Error ? e.message : 'unknown parseInt error'};
		}
	},
	toString: (value: number): string => {
		return `${value}`;
	},
};
