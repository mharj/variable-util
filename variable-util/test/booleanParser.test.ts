import {describe, expect, it} from 'vitest';
import {booleanParser, type IConfigLoader} from '../src';

const testLoader: IConfigLoader = {
	loaderType: 'unit',
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
};

describe('Test boolean parser', function () {
	it('should parse values', async function () {
		expect(await booleanParser().parse({loader: testLoader, key: 'key', value: 'true'})).to.equal(true);
		expect(await booleanParser().parse({loader: testLoader, key: 'key', value: true as unknown as string})).to.equal(true);
	});
});
