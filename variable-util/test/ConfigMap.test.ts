/* eslint-disable no-unused-expressions */
/* eslint-disable sort-keys */
/* eslint-disable sonarjs/no-duplicate-string */
import 'cross-fetch/polyfill';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';
import * as sinon from 'sinon';
import * as z from 'zod';
import {booleanParser, ConfigMap, env, integerParser, setLogger, stringParser, UrlParser, validLiteral} from '../src/';
import {Result} from 'mharj-result';
import {URL} from 'url';

dotenv.config();
chai.use(chaiAsPromised);
const expect = chai.expect;

const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

export const spyLogger = {
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
};

type TestEnv = {
	PORT: number;
	DEMO?: string;
	HOST: string;
	DEBUG: boolean;
	URL: URL;
	CONSTANT: 'constant';
};

const testEnvSchema = z.object({
	DEBUG: z.boolean(),
	DEMO: z.string().optional(),
	HOST: z.string(),
	PORT: z.number(),
	URL: z.instanceof(URL),
	CONSTANT: z.literal('constant'),
});

const config = new ConfigMap<TestEnv>({
	DEBUG: {loaders: [env()], parser: booleanParser(), defaultValue: false, params: {cache: false}},
	DEMO: {loaders: [env()], parser: stringParser()},
	HOST: {loaders: [env()], parser: stringParser(), defaultValue: 'localhost'},
	PORT: {loaders: [env()], parser: integerParser(), defaultValue: 3000},
	URL: {loaders: [env()], parser: new UrlParser({urlSanitize: true}), defaultValue: new URL('http://localhost:3000')},
	CONSTANT: {loaders: [env()], parser: stringParser(validLiteral(['constant'] as const)), defaultValue: 'constant'},
});

describe('ConfigMap', () => {
	before(() => {
		setLogger(spyLogger);
	});
	beforeEach(() => {
		debugSpy.resetHistory();
		infoSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		traceSpy.resetHistory();
	});
	describe('get', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Promise<number> = config.get('PORT');
			await expect(call).to.be.eventually.eq(6000);
			expect(infoSpy.callCount).to.be.eq(1);
		});
		it('should return PORT env value (cached)', async function () {
			process.env.PORT = '6000';
			const call: Promise<number> = config.get('PORT');
			await expect(call).to.be.eventually.eq(6000);
			expect(infoSpy.callCount).to.be.eq(0);
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
			expect(infoSpy.callCount).to.be.eq(1);
		});
		it('should return DEBUG env value (not cached)', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).to.be.eventually.eq(true);
			expect(infoSpy.callCount).to.be.eq(1);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com';
			const call: Promise<URL> = config.get('URL');
			await expect(call).to.be.eventually.eql(new URL('https://www.google.com'));
		});
		it('should return CONSTANT env value', async function () {
			process.env.CONSTANT = 'constant';
			const call: Promise<'constant'> = config.get('CONSTANT');
			await expect(call).to.be.eventually.eq('constant');
		});
	});
	describe('getString', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Promise<string> = config.getString('PORT');
			await expect(call).to.be.eventually.eq('6000');
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: Promise<string> = config.getString('HOST');
			await expect(call).to.be.eventually.eq('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<string> = config.getString('DEBUG');
			await expect(call).to.be.eventually.eq('true');
		});
		it('should return DEMO env value', async function () {
			const call: Promise<string | undefined> = config.getString('DEMO');
			await expect(call).to.be.eventually.eq(undefined);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com/';
			const call: Promise<string> = config.getString('URL');
			await expect(call).to.be.eventually.eq('https://www.google.com/');
		});
	});
	describe('getStringResult', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Result<string, unknown> = await config.getStringResult('PORT');
			expect(call.ok()).to.be.eq('6000');
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: Result<string, unknown> = await config.getStringResult('HOST');
			expect(call.ok()).to.be.eq('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: Result<string | undefined, unknown> = await config.getStringResult('DEBUG');
			expect(call.ok()).to.be.eq('true');
		});
		it('should return DEMO env value', async function () {
			const call: Result<string | undefined, unknown> = await config.getStringResult('DEMO');
			expect(call.ok()).to.be.eq(undefined);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com/';
			const call: Result<string | undefined, unknown> = await config.getStringResult('URL');
			expect(call.ok()).to.be.eq('https://www.google.com/');
		});
	});
	describe('getResult', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Result<number> = await config.getResult('PORT');
			expect(call.ok()).to.be.eq(6000);
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: Result<string> = await config.getResult('HOST');
			expect(call.ok()).to.be.eq('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: Result<boolean> = await config.getResult('DEBUG');
			expect(call.ok()).to.be.eq(true);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com';
			const call: Result<URL> = await config.getResult('URL');
			expect(call.ok()).to.be.eql(new URL('https://www.google.com'));
		});
	});
	describe('getAll', () => {
		it('should get all values', async function () {
			const call = config.getAllObjects();
			await expect(call).to.be.eventually.eql({
				DEBUG: {type: 'env', value: true, stringValue: 'true'},
				DEMO: {type: undefined, value: undefined, stringValue: undefined},
				HOST: {type: 'env', value: 'minecraft', stringValue: 'minecraft'},
				PORT: {type: 'env', value: 6000, stringValue: '6000'},
				URL: {type: 'env', value: new URL('https://www.google.com/'), stringValue: 'https://www.google.com/'},
				CONSTANT: {type: 'env', value: 'constant', stringValue: 'constant'},
			});
		});
	});
	describe('validateAll', () => {
		it('should validate all with zod', async function () {
			await config.validateAll((data) => testEnvSchema.parse(data));
		});
	});
});
