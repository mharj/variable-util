import {IConfigParser} from '../interfaces/IConfigParser';
import {IValidateResponse} from '../interfaces/IValidate';

export const stringParser: IConfigParser<string> = {
	name: 'stringParser',
	parse: async (key: string, value: string): Promise<string> => {
		return value;
	},
	preValidate: async (key: string, value: string): Promise<IValidateResponse> => {
		if (typeof value !== 'string') {
			return {success: false, message: `variables: value for key ${key} is not a string`};
		}
		return {success: true};
	},
	toString: (value: string): string => {
		return value;
	},
};
