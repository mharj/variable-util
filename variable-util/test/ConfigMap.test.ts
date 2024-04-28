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
import {testObjectFinalSchema, testObjectParser, TestObjectType} from './testObjectParse';
import {Result} from '@luolapeikko/result-option';
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
	TEST_OBJECT: TestObjectType;
	NOT_EXISTS: string;
};

const testEnvSchema = z.object({
	DEBUG: z.boolean(),
	DEMO: z.string().optional(),
	HOST: z.string(),
	PORT: z.number(),
	URL: z.instanceof(URL),
	CONSTANT: z.literal('constant'),
	TEST_OBJECT: testObjectFinalSchema,
	NOT_EXISTS: z.string(),
});

const config = new ConfigMap<TestEnv>(
	{
		DEBUG: {loaders: [env()], parser: booleanParser(), defaultValue: false},
		DEMO: {loaders: [env()], parser: stringParser()},
		HOST: {loaders: [env()], parser: stringParser(), defaultValue: 'localhost'},
		PORT: {loaders: [env()], parser: integerParser(), defaultValue: 3000},
		URL: {
			loaders: [env()],
			parser: new UrlParser({urlSanitize: true}),
			defaultValue: new URL('http://localhost:3000'),
			params: {showValue: true},
		},
		CONSTANT: {loaders: [env()], parser: stringParser(validLiteral(['constant'] as const)), defaultValue: 'constant'},
		TEST_OBJECT: {loaders: [env()], parser: testObjectParser, defaultValue: {First: false, Second: false, Third: true}},
		NOT_EXISTS: {loaders: [env()], parser: stringParser(), undefinedThrowsError: true, undefinedErrorMessage: 'add NOT_EXISTS to env'},
	},
	{namespace: 'Demo'},
);

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
		it('should return DEBUG env value (already seen)', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).to.be.eventually.eq(true);
			expect(infoSpy.callCount).to.be.eq(0);
		});
		it('should return DEBUG env value (change)', async function () {
			process.env.DEBUG = 'false';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).to.be.eventually.eq(false);
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
		it('should return CONSTANT env value', async function () {
			const call: Promise<string> = config.get('NOT_EXISTS');
			await expect(call).to.be.eventually.rejectedWith('add NOT_EXISTS to env');
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
			process.env.URL = 'https://asd:qwe@www.google.com';
			const call: Result<URL> = await config.getResult('URL');
			expect(call.ok()?.href).to.be.eql(new URL('https://asd:qwe@www.google.com').href);
			expect(infoSpy.args[0][0]).to.be.eq('ConfigVariables:Demo[env]: URL [https://***:***@www.google.com/] from process.env.URL');
		});
	});
	describe('getAll', () => {
		it('should get all values', async function () {
			process.env.NOT_EXISTS = 'not_exists'; // else it will throw error
			const call = config.getAllObjects();
			const result = await call;
			await expect(call).to.be.eventually.eql({
				DEBUG: {type: 'env', value: true, stringValue: 'true', namespace: 'Demo'},
				DEMO: {type: undefined, value: undefined, stringValue: undefined, namespace: 'Demo'},
				HOST: {type: 'env', value: 'minecraft', stringValue: 'minecraft', namespace: 'Demo'},
				NOT_EXISTS: {type: 'env', value: 'not_exists', stringValue: 'not_exists', namespace: 'Demo'},
				PORT: {type: 'env', value: 6000, stringValue: '6000', namespace: 'Demo'},
				URL: {type: 'env', value: result.URL.value, stringValue: 'https://asd:qwe@www.google.com/', namespace: 'Demo'},
				CONSTANT: {type: 'env', value: 'constant', stringValue: 'constant', namespace: 'Demo'},
				TEST_OBJECT: {
					stringValue: 'First=false;Second=false;Third=true',
					type: 'default',
					value: {
						First: false,
						Second: false,
						Third: true,
					},
					namespace: 'Demo',
				},
			});
		});
	});
	describe('validateAll', () => {
		it('should validate all with zod', async function () {
			process.env.NOT_EXISTS = 'not_exists'; // else it will throw error
			await config.validateAll((data) => testEnvSchema.parse(data));
		});
	});
	describe('validate', () => {
		it('should validate all with zod', async function () {
			expect(await config.getString('TEST_OBJECT')).to.be.eq('First=false;Second=false;Third=true');
		});
	});
});
