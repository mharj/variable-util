/* eslint-disable sonarjs/no-duplicate-string */
import 'cross-fetch/polyfill';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';
import * as z from 'zod';
import {booleanParser, ConfigMap, env, integerParser, stringParser, UrlParser} from '../src/';
import {URL} from 'url';
dotenv.config();
chai.use(chaiAsPromised);
const expect = chai.expect;

type TestEnv = {
	PORT: number;
	HOST: string;
	DEBUG: boolean;
	URL: URL;
};

const testEnvSchema = z.object({
	DEBUG: z.boolean(),
	HOST: z.string(),
	PORT: z.number(),
	URL: z.instanceof(URL),
});

const config = new ConfigMap<TestEnv>({
	DEBUG: {loaders: [env()], parser: booleanParser, defaultValue: false},
	HOST: {loaders: [env()], parser: stringParser, defaultValue: 'localhost'},
	PORT: {loaders: [env()], parser: integerParser, defaultValue: 3000},
	URL: {loaders: [env()], parser: new UrlParser({urlSanitize: true}), defaultValue: new URL('http://localhost:3000')},
});

describe('ConfigMap', () => {
	describe('get', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Promise<number> = config.get('PORT');
			await expect(call).to.be.eventually.eq(6000);
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: Promise<string> = config.get('HOST');
			await expect(call).to.be.eventually.eq('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).to.be.eventually.eq(true);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com';
			const call: Promise<URL> = config.get('URL');
			await expect(call).to.be.eventually.eql(new URL('https://www.google.com'));
		});
	});
	describe('getAll', () => {
		it('should get all values', async function () {
			const call = config.getAll();
			await expect(call).to.be.eventually.eql({
				DEBUG: {type: 'env', value: true},
				HOST: {type: 'env', value: 'minecraft'},
				PORT: {type: 'env', value: 6000},
				URL: {type: 'env', value: new URL('https://www.google.com/')},
			});
		});
	});
	describe('validateAll', () => {
		it('should validate all with zod', async function () {
			await config.validateAll((data) => testEnvSchema.parse(data));
		});
	});
});
