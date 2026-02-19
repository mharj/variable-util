import {describe, expect, it} from 'vitest';
import {booleanParser, type IConfigLoader} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

describe('Test boolean parser', function () {
	it('should parse values', async function () {
		expect(await booleanParser().parse({key: 'key', loader: testLoader, value: 'true'})).to.equal(true);
		expect(await booleanParser().parse({key: 'key', loader: testLoader, value: true as unknown as string})).to.equal(true);
	});
});
