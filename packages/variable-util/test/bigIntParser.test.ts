import {describe, expect, it} from 'vitest';
import {bigIntParser, type IConfigLoader, type TypeGuardValidate} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const trueValidate: TypeGuardValidate<bigint> = (value: unknown): value is bigint => true;
const falseValidate: TypeGuardValidate<bigint> = (value: unknown): value is bigint => false;

describe('Test bigint parser', function () {
	it('should parse values', async function () {
		expect(await bigIntParser().parse({key: 'key', loader: testLoader, value: '123'})).to.equal(123n);
		expect(() => bigIntParser().parse({key: 'key', loader: testLoader, value: 'abc'})).toThrowError('value for key key is not an integer string');
	});
	it('should postValidate values', async function () {
		expect(await bigIntParser(trueValidate).postValidate?.({key: 'key', loader: testLoader, value: 150n})).to.equal(150n);
		expect(await bigIntParser(falseValidate).postValidate?.({key: 'key', loader: testLoader, value: 150n})).to.equal(undefined);
		expect(await bigIntParser().postValidate?.({key: 'key', loader: testLoader, value: 50n})).to.equal(50n);
	});
});
