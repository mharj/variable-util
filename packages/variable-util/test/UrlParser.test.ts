import {describe, expect, it} from 'vitest';
import {type IConfigLoader, UrlParser} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const parser = new UrlParser();

describe('Test Url parser', function () {
	it('should parse values', function () {
		expect(parser.parse({key: 'key', loader: testLoader, value: 'http://localhost'})).to.eql(new URL('http://localhost'));
		expect(() => parser.parse({key: 'key', loader: testLoader, value: 'true'})).toThrowError('Invalid URL');
	});
});
