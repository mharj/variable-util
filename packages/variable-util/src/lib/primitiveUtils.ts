import {Err, type IResult, Ok} from '@luolapeikko/result-option';

/**
 * Get an integer from a string
 * @param {string} value - string to parse
 * @returns {IResult<number, TypeError>} - Ok if value is an integer string, Err if not
 * @since v0.2.5
 */
export function getInteger(value: string): IResult<number, TypeError> {
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed)) {
		return Err(new TypeError(`${value} is not an integer string`));
	}
	return Ok(parsed);
}

const booleanTrueStringValues = ['true', '1', 'yes', 'y', 'on'];
const booleanFalseStringValues = ['false', '0', 'no', 'n', 'off'];

const allBooleanStringValues = [...booleanFalseStringValues, ...booleanTrueStringValues];

/**
 * Parse a string or boolean into a boolean value.
 * @param {string | boolean} value - The value to parse.
 * @returns {IResult<boolean, TypeError>} - Ok with boolean if successful, Err with TypeError if not.
 * @since v0.2.5
 */
export function getBoolean(value: string | boolean): IResult<boolean, TypeError> {
	if (typeof value === 'boolean') {
		return Ok(value);
	}
	const output = value.toLowerCase();
	if (!allBooleanStringValues.includes(output)) {
		return Err(new TypeError(`${value} is not a boolean string`));
	}
	return Ok(booleanTrueStringValues.includes(output));
}

/**
 * Simply returns the input string as a successful result.
 * @param {string} value - input string
 * @returns {IResult<string, TypeError>} - Ok with input string, never Err
 * @since v0.2.5
 */
export function getString(value: string): IResult<string, TypeError> {
	return Ok(value);
}

/**
 * Parse a string into a float value.
 * @param {string} value - The value to parse.
 * @returns {IResult<number, TypeError>} - Ok with float if successful, Err with TypeError if not.
 * @since v0.2.5
 */
export function getFloat(value: string): IResult<number, TypeError> {
	const parsed = parseFloat(value);
	if (Number.isNaN(parsed)) {
		return Err(new TypeError(`${value} is not a float string`));
	}
	return Ok(parsed);
}

/**
 * Parse a string into a bigint value.
 * @param {string} value - The value to parse.
 * @returns {IResult<bigint, TypeError>} - Ok with bigint if successful, Err with TypeError if not.
 * @since v0.2.5
 */
export function getBigInt(value: string): IResult<bigint, TypeError> {
	try {
		return Ok(BigInt(value));
	} catch (_err) {
		return Err(new TypeError(`${value} is not a bigint string`));
	}
}
