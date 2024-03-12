/* eslint-disable sonarjs/no-duplicate-string */
import 'cross-fetch/polyfill';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';
import * as etag from 'etag';
import * as sinon from 'sinon';
import * as z from 'zod';
import {
	booleanParser,
	createRequestNotReady,
	env,
	FetchConfigLoader,
	floatParser,
	getConfigVariable,
	IConfigLoader,
	integerParser,
	IRequestCache,
	JsonConfigParser,
	reactEnv,
	RequestNotReady,
	SemicolonConfigParser,
	setLogger,
	stringParser,
	UrlParser,
	ValidateCallback,
	validLiteral,
} from '../src/';
import {testObjectParser} from './testObjectParse';
import {URL} from 'url';

chai.use(chaiAsPromised);

const expect = chai.expect;

dotenv.config();
const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

let isOnline = true;
const resCache = new Map<string, Response>();
const API_SERVER = 'http://localhost:123/api';

const fetchResponsePayload = {
	API_SERVER,
	TEST_OBJECT: 'First=false;Second=false;Third=true',
};

function mockFetch(input: globalThis.URL | RequestInfo, init?: RequestInit | undefined): Promise<Response> {
	const req = new Request(input, init);
	const bodyData = JSON.stringify(fetchResponsePayload);
	const etagValue = etag(bodyData);

	// cache hit
	if (req.headers.get('If-None-Match') === etagValue) {
		return Promise.resolve(new Response(undefined, {status: 304}));
	}

	return Promise.resolve(new Response(bodyData, {status: 200, headers: {ETag: etagValue, 'Content-Type': 'application/json'}}));
}

const reqCacheSetup: IRequestCache = {
	isOnline() {
		return isOnline;
	},
	storeRequest(req, res) {
		resCache.set(req.url, res.clone());
		return Promise.resolve();
	},
	fetchRequest(req) {
		return Promise.resolve(resCache.get(req.url)?.clone());
	},
};

const spyLogger = {
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
};

const objectSchema = z.object({
	foo: z.string(),
	baz: z.string(),
});
type ObjectSchema = z.infer<typeof objectSchema>;

const validate: ValidateCallback<ObjectSchema, Record<string, unknown>> = async (data: Record<string, unknown>) => {
	return objectSchema.parseAsync(data);
};

const stringRecordSchema = z.record(z.string().min(1), z.string().optional());

const fetchValidate: ValidateCallback<Record<string, string | undefined>, Record<string, unknown>> = async (data: Record<string, unknown>) => {
	return stringRecordSchema.parseAsync(data);
};

let fetchEnv: (params?: string | undefined) => IConfigLoader;
const urlDefault = new URL('http://localhost/api');
let fetchRequestData: Request | undefined;

const fetchLoaderOptions = {cache: reqCacheSetup, fetchClient: mockFetch, logger: spyLogger, validate: fetchValidate};

function handleFetchRequest(): Request | RequestNotReady {
	if (fetchRequestData) {
		return fetchRequestData;
	}
	return createRequestNotReady('fetch request not ready');
}

const configRequestUrl = new URL('http://some/settings.json');

describe('config variable', () => {
	before(() => {
		setLogger(spyLogger);
	});
	beforeEach(() => {
		delete process.env.REACT_APP_TEST;
		delete process.env.TEST;
		debugSpy.resetHistory();
		infoSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		traceSpy.resetHistory();
	});
	it('should return default value', async function () {
		const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), 'some_value', {showValue: true});
		await expect(call).to.be.eventually.eq('some_value');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
	});
	describe('default values', () => {
		it('should return default value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), 'some_value', {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return boolean default value', async function () {
			const call: Promise<boolean> = getConfigVariable('TEST', [], booleanParser(), false, {showValue: true});
			await expect(call).to.be.eventually.eq(false);
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [false] from default`);
		});
		it('should return default promise value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), Promise.resolve('some_value'), {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default callback value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), () => 'some_value', {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default callback promise value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), () => Promise.resolve('some_value'), {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
	});
	describe('loaders', () => {
		it('should return process env value', async function () {
			process.env.TEST = 'asd';
			const call: Promise<string | undefined> = getConfigVariable('TEST', [env()], stringParser(), undefined, {showValue: true});
			await expect(call).to.be.eventually.eq('asd');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd] from process.env.TEST`);
		});
		it('should return process react env value', async function () {
			process.env.REACT_APP_TEST = 'asd';
			const call: Promise<string | undefined> = getConfigVariable('TEST', [reactEnv()], stringParser(), undefined, {showValue: true});
			await expect(call).to.be.eventually.eq('asd');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[react-env]: TEST [asd] from process.env.REACT_APP_TEST`);
		});
		describe('FetchConfigLoader', () => {
			beforeEach(function () {
				fetchEnv = new FetchConfigLoader(handleFetchRequest, fetchLoaderOptions).getLoader;
			});
			it('should return default if fetch request not ready yet', async function () {
				expect(await getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true})).to.be.eql(urlDefault);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: API_SERVER [${urlDefault}] from default`);
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq('FetchEnvConfig: fetch request not ready');
			});
			it('should return fetch URL value', async function () {
				const value = new URL(API_SERVER);
				const req = new Request(configRequestUrl);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${value}] from ${configRequestUrl}`);
				expect(debugSpy.callCount).to.be.eq(3);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${configRequestUrl}`);
				expect(debugSpy.getCall(1).args[0]).to.be.an('string').and.eq(`storing response in cache for FetchEnvConfig`);
				expect(debugSpy.getCall(2).args[0]).to.be.an('string').and.eq(`successfully loaded config from FetchEnvConfig`);
				expect(output).to.be.eql(value);
			});
			it('should return fetch Object value', async function () {
				const req = new Request(configRequestUrl, {headers: {'If-None-Match': '123'}});
				fetchRequestData = req;
				const call = getConfigVariable('TEST_OBJECT', [fetchEnv()], testObjectParser, undefined, {showValue: true});
				await call;
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: TEST_OBJECT [First=false;Second=false;Third=true] from ${configRequestUrl}`);
				expect(debugSpy.callCount).to.be.eq(3);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${configRequestUrl}`);
				expect(debugSpy.getCall(1).args[0]).to.be.an('string').and.eq(`returned cached response for FetchEnvConfig`);
				expect(debugSpy.getCall(2).args[0]).to.be.an('string').and.eq(`successfully loaded config from FetchEnvConfig`);
			});
			it('should get cache hit', async function () {
				const value = new URL(API_SERVER);
				const req = new Request(configRequestUrl);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${value}] from ${configRequestUrl}`);
				expect(debugSpy.callCount).to.be.eq(3);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${configRequestUrl}`);
				expect(debugSpy.getCall(1).args[0]).to.be.an('string').and.eq(`returned cached response for FetchEnvConfig`);
				expect(debugSpy.getCall(2).args[0]).to.be.an('string').and.eq(`successfully loaded config from FetchEnvConfig`);
				expect(output).to.be.eql(value);
			});
			it('should return cached fetch value when offline', async function () {
				isOnline = false;
				const value = new URL(API_SERVER);
				const req = new Request(configRequestUrl);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(errorSpy.callCount, errorSpy.getCall(0)?.args.join(' ')).to.be.eq(0);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${value}] from ${configRequestUrl}`);
				expect(debugSpy.callCount).to.be.eq(4);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${configRequestUrl}`);
				expect(debugSpy.getCall(1).args[0]).to.be.an('string').and.eq(`client is offline, returned cached response for FetchEnvConfig`);
				expect(debugSpy.getCall(2).args[0]).to.be.an('string').and.eq(`storing response in cache for FetchEnvConfig`);
				expect(debugSpy.getCall(3).args[0]).to.be.an('string').and.eq(`successfully loaded config from FetchEnvConfig`);
				expect(output).to.be.eql(value);
			});
		});
	});
	describe('parsers', () => {
		describe('string', () => {
			it('should return process env string literal value', async function () {
				process.env.TEST = 'one';
				const options = ['one', 'two', 'three'] as const;
				type Options = (typeof options)[number];
				const value: Options | undefined = await getConfigVariable('TEST', [env()], stringParser(validLiteral(options)), undefined, {
					showValue: true,
					cache: false,
				});
				expect(value).to.be.eq('one');
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [one] from process.env.TEST`);
			});
		});
		describe('boolean', () => {
			it('should return process env boolean true value', async function () {
				process.env.TEST = 'YES';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env(), reactEnv()], booleanParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(true);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [true] from process.env.TEST`);
			});
			it('should return process env boolean false value', async function () {
				process.env.TEST = 'N';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env(), reactEnv()], booleanParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(false);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [false] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env(), reactEnv()], booleanParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[booleanParser]: [__BROKEN__] value for key TEST'), errorLog.message);
			});
		});
		describe('integer', () => {
			it('should return process env integer value', async function () {
				process.env.TEST = '02';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], integerParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(2);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [2] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], integerParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[integerParser]: [__BROKEN__] value for key TEST'), errorLog.message);
			});
		});
		describe('float', () => {
			it('should return process env float value', async function () {
				process.env.TEST = '2.5';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], floatParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(2.5);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [2.5] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], floatParser(), undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[floatParser]: [__BROKEN__] value for key TEST'), errorLog.message);
			});
		});
		describe('config', () => {
			it('should return process env config', async function () {
				process.env.TEST = 'foo=bar;baz=qux';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env(), reactEnv()],
					new SemicolonConfigParser({validate, keysToHide: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).to.be.eventually.eql({foo: 'bar', baz: 'qux'});
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [foo=bar;baz=***] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env(), reactEnv()],
					new SemicolonConfigParser({validate, keysToHide: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).to.be.eventually.eql(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[semicolonConfigParser]: [__BROKEN__]'), errorLog.message);
			});
		});
		describe('JSON', () => {
			it('should return process env json', async function () {
				process.env.TEST = '{"foo": "bar", "baz": "qux"}';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env(), reactEnv()],
					new JsonConfigParser({validate, keysToHide: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).to.be.eventually.eql({foo: 'bar', baz: 'qux'});
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [{"foo":"bar","baz":"***"}] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env(), reactEnv()],
					new JsonConfigParser({validate, keysToHide: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).to.be.eventually.eql(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy(
						(err: Error) => err.message.startsWith('variables[jsonConfigParser]: [__BROKEN__] Unexpected token _ in JSON at position 0'),
						errorLog.message,
					);
			});
		});
	});
});
