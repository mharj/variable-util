import {Err, type IResult, Ok} from '@luolapeikko/result-option';

/**
 * Get an integer from a string
 * @param {string} value - string to parse
 * @returns {IResult<number, TypeError>} - Ok if value is an integer string, Err if not
 */
export function getInteger(value: string): IResult<number, TypeError> {
	const parsed = parseInt(value, 10);
	if (isNaN(parsed)) {
		return Err(new TypeError(`${value} is not an integer string`));
	}
	return Ok(parsed);
}

const booleanTrueStringValues = ['true', '1', 'yes', 'y', 'on'];
const booleanFalseStringValues = ['false', '0', 'no', 'n', 'off'];

const allBooleanStringValues = [...booleanFalseStringValues, ...booleanTrueStringValues];

export function getBoolean(value: string | boolean): IResult<boolean, TypeError> {
	if (typeof value === 'boolean') {
		return Ok(value);
	}
	const output = value.toLowerCase();
	if (!allBooleanStringValues.includes(output)) {
		return Err(new TypeError(`${value} is not an boolean string`));
	}
	return Ok(booleanTrueStringValues.includes(output));
}

export function getString(value: string): IResult<string, TypeError> {
	return Ok(value);
}

export function getFloat(value: string): IResult<number, TypeError> {
	const parsed = parseFloat(value);
	if (isNaN(parsed)) {
		return Err(new TypeError(`${value} is not a float string`));
	}
	return Ok(parsed);
}

export function getBigInt(value: string): IResult<bigint, TypeError> {
	try {
		return Ok(BigInt(value));
	} catch (_err) {
		return Err(new TypeError(`${value} is not a bigint string`));
	}
}
