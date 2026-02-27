import {describe, expect, it} from 'vitest';
import {type IConfigLoader, integerParser, type TypeGuardValidate} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const trueValidate: TypeGuardValidate<number> = (value: unknown): value is number => true;
const falseValidate: TypeGuardValidate<number> = (value: unknown): value is number => false;

describe('Test integer parser', function () {
	it('should parse values', async function () {
		expect(await integerParser().parse({key: 'key', loader: testLoader, value: '123'})).to.equal(123);
		expect(() => integerParser().parse({key: 'key', loader: testLoader, value: 'abc'})).toThrowError('value for key key is not an integer string');
	});
	it('should postValidate values', async function () {
		expect(await integerParser(trueValidate).postValidate?.({key: 'key', loader: testLoader, value: 150})).to.equal(150);
		expect(await integerParser(falseValidate).postValidate?.({key: 'key', loader: testLoader, value: 150})).to.equal(undefined);
		expect(await integerParser().postValidate?.({key: 'key', loader: testLoader, value: 50})).to.equal(50);
	});
});
