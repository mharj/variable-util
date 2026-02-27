import {describe, expect, it} from 'vitest';
import {arrayParser, type IConfigLoader, integerParser, type TypeGuardValidate} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const trueValidate: TypeGuardValidate<number> = (value: unknown): value is number => true;
const falseValidate: TypeGuardValidate<number> = (value: unknown): value is number => false;

describe('Test array parser', function () {
	it('should parse values', async function () {
		expect(await arrayParser(integerParser()).parse({key: 'key', loader: testLoader, value: '1;2;3'})).toEqual([1, 2, 3]);
		expect(await arrayParser(integerParser(), ',').parse({key: 'key', loader: testLoader, value: '4,5'})).toEqual([4, 5]);
		expect(() => arrayParser(integerParser()).parse({key: 'key', loader: testLoader, value: '1;nope'})).toThrowError(
			'value for key key is not an integer string',
		);
	});
	it('should postValidate values', async function () {
		expect(await arrayParser(integerParser(), ';', trueValidate).postValidate?.({key: 'key', loader: testLoader, value: [1, 2, 3]})).toEqual([1, 2, 3]);
		expect(await arrayParser(integerParser(), ';', falseValidate).postValidate?.({key: 'key', loader: testLoader, value: [1, 2, 3]})).toEqual([]);
		expect(await arrayParser(integerParser()).postValidate?.({key: 'key', loader: testLoader, value: [7, 8]})).toEqual([7, 8]);
	});
});
