import {describe, expect, it} from 'vitest';
import {floatParser, type IConfigLoader, type TypeGuardValidate} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const trueValidate: TypeGuardValidate<number> = (value: unknown): value is number => true;
const falseValidate: TypeGuardValidate<number> = (value: unknown): value is number => false;

describe('Test float parser', function () {
	it('should parse values', async function () {
		expect(await floatParser().parse({key: 'key', loader: testLoader, value: '123.45'})).to.equal(123.45);
		expect(await floatParser().parse({key: 'key', loader: testLoader, value: '123'})).to.equal(123);
		expect(() => floatParser().parse({key: 'key', loader: testLoader, value: 'abc'})).toThrowError('value for key key is not a float string');
	});
	it('should postValidate values', async function () {
		expect(await floatParser(trueValidate).postValidate?.({key: 'key', loader: testLoader, value: 150.5})).to.equal(150.5);
		expect(await floatParser(falseValidate).postValidate?.({key: 'key', loader: testLoader, value: 150.5})).to.equal(undefined);
		expect(await floatParser().postValidate?.({key: 'key', loader: testLoader, value: 50.25})).to.equal(50.25);
	});
});
