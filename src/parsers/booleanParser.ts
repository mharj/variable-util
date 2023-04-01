import {IConfigParser} from '../interfaces/IConfigParser';

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
export const booleanParser: IConfigParser<boolean, boolean> = {
	name: 'booleanParser',
	parse: async (key: string, value: string): Promise<boolean> => {
		if (typeof value !== 'string') {
			throw new TypeError(`value for key ${key} is not a string`);
		}
		const output = value.toLowerCase();
		if (!allBooleanStringValues.includes(output)) {
			throw new TypeError(`value for key ${key} is not valid boolean string`);
		}
		return booleanTrueStringValues.includes(output);
	},
	toString: (value: boolean): string => {
		return value ? 'true' : 'false';
	},
};
