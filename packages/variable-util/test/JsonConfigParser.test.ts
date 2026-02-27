import {describe, expect, it} from 'vitest';
import {type IConfigLoader, JsonConfigParser} from '../src';

const testLoader: IConfigLoader = {
	getLoaderResult: () => undefined,
	isLoaderDisabled: () => false,
	loaderType: 'unit',
};

const parser = new JsonConfigParser();

describe('Test JsonConfigParser parser', function () {
	it('should parse values', function () {
		expect(parser.parse({key: 'key', loader: testLoader, value: '{}'})).to.eql({});
		expect(parser.parse({key: 'key', loader: testLoader, value: true as unknown as string})).to.eql({});
		expect(parser.parse({key: 'key', loader: testLoader, value: null as unknown as string})).to.eql({});
		expect(parser.parse({key: 'key', loader: testLoader, value: 'null'})).to.eql({});
	});
	it('should convert values to string', function () {
		expect(parser.toString({value: 'test'})).to.eql('{"value":"test"}');
		expect(parser.toLogString({value: 'test'})).to.eql('{"value":"test"}');
	});
	it('should skip falsy values in toString/toLogString', function () {
		const parser = new JsonConfigParser<{value: string; empty: string; zero: number; flag: boolean}>();
		expect(parser.toString({empty: '', flag: false, value: 'ok', zero: 0})).to.eql('{"value":"ok"}');
		expect(parser.toLogString({empty: '', flag: false, value: 'ok', zero: 0})).to.eql('{"value":"ok"}');
	});
	it('should mask protected keys in toLogString', function () {
		const parser = new JsonConfigParser<{secret: string; value: string}>({
			protectedKeys: ['secret'],
			showProtectedKeys: false,
		});
		expect(parser.toString({secret: 'topsecret', value: 'ok'})).to.eql('{"secret":"topsecret","value":"ok"}');
		expect(parser.toLogString({secret: 'topsecret', value: 'ok'})).to.eql('{"secret":"*********","value":"ok"}');
	});
});
