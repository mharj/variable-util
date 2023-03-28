import {IConfigParser} from '../interfaces/IConfigParser';
import {IValidateResponse} from '../interfaces/IValidate';

const booleanTrueStringValues = ['true', '1', 'yes', 'y', 'on'];
const booleanFalseStringValues = ['false', '0', 'no', 'n', 'off'];

const allBooleanStringValues = [...booleanFalseStringValues, ...booleanTrueStringValues];

/**
 * parses a string to a boolean
 *
 * supports the following string ___true___ values:
 * - true
 * - 1
 * - yes
 * - y
 * - on
 *
 * supports the following string ___false___ values:
 * - false
 * - 0
 * - no
 * - n
 * - off
 */
export const booleanParser: IConfigParser<boolean> = {
	name: 'booleanParser',
	parse: async (key: string, value: string): Promise<boolean> => {
		return booleanTrueStringValues.includes(value.toLowerCase());
	},
	preValidate: async (key: string, value: string): Promise<IValidateResponse> => {
		if (typeof value !== 'string') {
			return {success: false, message: `variables: value for key ${key} is not a string`};
		}
		if (!allBooleanStringValues.includes(value.toLowerCase())) {
			return {success: false, message: `variables: value for key ${key} valid boolean string`};
		}
		return {success: true};
	},
	toString: (value: boolean): string => {
		return value ? 'true' : 'false';
	},
};
