import {describe, expect, it} from 'vitest';
import {booleanParser, type IConfigLoader, type TypeGuardValidate} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const trueValidate: TypeGuardValidate<boolean> = (value: unknown): value is boolean => true;
const falseValidate: TypeGuardValidate<boolean> = (value: unknown): value is boolean => false;

describe('Test boolean parser', function () {
	it('should parse values', async function () {
		expect(await booleanParser().parse({key: 'key', loader: testLoader, value: 'true'})).to.equal(true);
		expect(await booleanParser().parse({key: 'key', loader: testLoader, value: true as unknown as string})).to.equal(true);
		expect(() => booleanParser().parse({key: 'key', loader: testLoader, value: 'abc'})).toThrowError('value for key key is not a boolean string');
	});
	it('should postValidate values', async function () {
		expect(await booleanParser(trueValidate).postValidate?.({key: 'key', loader: testLoader, value: true})).to.equal(true);
		expect(await booleanParser(falseValidate).postValidate?.({key: 'key', loader: testLoader, value: true})).to.equal(undefined);
		expect(await booleanParser().postValidate?.({key: 'key', loader: testLoader, value: false})).to.equal(false);
	});
});
