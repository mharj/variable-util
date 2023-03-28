import {IConfigParser} from '../interfaces/IConfigParser';
import {IValidateResponse} from '../interfaces/IValidate';

export const floatParser: IConfigParser<number> = {
	name: 'floatParser',
	parse: async (key: string, value: string): Promise<number> => {
		return Promise.resolve(parseFloat(value));
	},
	preValidate: async (key: string, value: string): Promise<IValidateResponse> => {
		if (typeof value !== 'string') {
			return {success: false, message: `variables: value for key ${key} is not a string`};
		}
		try {
			parseFloat(value);
			return {success: true};
		} catch (e) {
			return {success: false, message: e instanceof Error ? e.message : 'unknown parseFloat error'};
		}
	},
	toString: (value: number): string => {
		return value.toString();
	},
};
