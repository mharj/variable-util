import {describe, expect, it} from 'vitest';
import {type IConfigLoader, stringParser, type TypeGuardValidate} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const trueValidate: TypeGuardValidate<string> = (value: unknown): value is string => true;
const falseValidate: TypeGuardValidate<string> = (value: unknown): value is string => false;

describe('Test string parser', function () {
	it('should parse values', async function () {
		expect(await stringParser().parse({key: 'key', loader: testLoader, value: 'true'})).to.equal('true');
		expect(() => stringParser().parse({key: 'key', loader: testLoader, value: true as unknown as string})).toThrowError('value for key key is not a string');
	});
	it('should postValidate values', async function () {
		expect(await stringParser(trueValidate).postValidate?.({key: 'key', loader: testLoader, value: 'test'})).to.equal('test');
		expect(await stringParser(falseValidate).postValidate?.({key: 'key', loader: testLoader, value: 'test'})).to.equal(undefined);
		expect(await stringParser().postValidate?.({key: 'key', loader: testLoader, value: 'test'})).to.equal('test');
	});
});
