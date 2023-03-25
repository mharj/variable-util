import {IValidateResponse} from './IValidate';

export interface IConfigParser<T> {
	/**
	 * name of the parser (not used yet)
	 */
	name: string;

	/**
	 * main parsing function
	 */
	parse(key: string, value: string): Promise<T>;

	/**
	 * optional raw value validation before parsing
	 */
	preValidate?(key: string, value: string): Promise<IValidateResponse>;

	/**
	 * optional value validation after parsing, expect to throw an error if the value is not valid
	 */
	postValidate?(key: string, value: T): Promise<IValidateResponse>;

	/**
	 * build readable string from value
	 */
	toString(value: T): string;
}
