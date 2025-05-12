import {URL} from 'url';
import {type ILoggerLike} from '@avanio/logger-like';
import * as dotenv from 'dotenv';
import etag from 'etag';
import {spy} from 'sinon';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {z} from 'zod';
import {
	booleanParser,
	clearDefaultValueSeenMap,
	createRequestNotReady,
	EnvConfigLoader,
	FetchConfigLoader,
	type FetchConfigLoaderOptions,
	floatParser,
	getConfigVariable,
	integerParser,
	type IRequestCache,
	JsonConfigParser,
	MemoryConfigLoader,
	ReactEnvConfigLoader,
	type RequestNotReady,
	SemicolonConfigParser,
	setLogger,
	stringParser,
	UrlParser,
	type ValidateCallback,
} from '../src';
import {testObjectParser} from './testObjectParse';

const env = new EnvConfigLoader();
const reactEnv = new ReactEnvConfigLoader();

dotenv.config();
const debugSpy = spy();
const infoSpy = spy();
const errorSpy = spy();
const warnSpy = spy();
const traceSpy = spy();

let isOnline = true;
const resCache = new Map<string, Response>();
const API_SERVER = 'http://localhost:123/api';

const fetchResponsePayload = {
	API_SERVER,
	TEST_OBJECT: 'First=false;Second=false;Third=true',
	NULL_VALUE: null,
};

function mockFetch(input: globalThis.URL | RequestInfo, init?: RequestInit): Promise<Response> {
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
} satisfies ILoggerLike;

const objectSchema = z.object({
	foo: z.string(),
	baz: z.string(),
	secret: z.string().optional(),
});
type ObjectSchema = z.infer<typeof objectSchema>;

const validate: ValidateCallback<object, ObjectSchema> = async (data) => {
	return objectSchema.parseAsync(data);
};

const stringRecordSchema = z.record(z.string().min(1), z.string().optional());

const fetchValidate: ValidateCallback<Record<string, string | undefined>, Record<string, string | undefined>> = async (data) => {
	return stringRecordSchema.parseAsync(data);
};

let fetchLoader: FetchConfigLoader;

const urlDefault = new URL('http://localhost/api');
let fetchRequestData: Request | undefined;
let isFetchDisabled = false;
const fetchLoaderOptions = {
	cache: reqCacheSetup,
	disabled: (): boolean => isFetchDisabled,
	fetchClient: mockFetch,
	logger: spyLogger,
	validate: fetchValidate,
} satisfies Partial<FetchConfigLoaderOptions>;

let memoryEnv: MemoryConfigLoader<{
	TEST: undefined;
}>;

function handleFetchRequest(): Request | RequestNotReady {
	if (fetchRequestData) {
		return fetchRequestData;
	}
	return createRequestNotReady('fetch request not ready');
}

const configRequestUrl = new URL('http://some/settings.json');

describe('config variable', () => {
	beforeAll(() => {
		setLogger(spyLogger);
	});
	beforeEach(() => {
		clearDefaultValueSeenMap();
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
		await expect(call).resolves.toEqual('some_value');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
	});
	describe('default values', () => {
		it('should return default value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), 'some_value', {showValue: true});
			await expect(call).resolves.toEqual('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return boolean default value', async function () {
			const call: Promise<boolean> = getConfigVariable('TEST', [], booleanParser(), false, {showValue: true});
			await expect(call).resolves.toEqual(false);
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [false] from default`);
		});
		it('should return default promise value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), Promise.resolve('some_value'), {showValue: true});
			await expect(call).resolves.toEqual('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default callback value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), () => 'some_value', {showValue: true});
			await expect(call).resolves.toEqual('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default callback promise value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), () => Promise.resolve('some_value'), {showValue: true});
			await expect(call).resolves.toEqual('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default value with partial show prefix', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), '7469ef1f-98f0-460a-b3db-5ea31d9e80c0', {showValue: 'prefix'});
			await expect(call).resolves.toEqual('7469ef1f-98f0-460a-b3db-5ea31d9e80c0');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [746*********************************] from default`);
		});
		it('should return default value with partial show suffix', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), '7469ef1f-98f0-460a-b3db-5ea31d9e80c0', {showValue: 'suffix'});
			await expect(call).resolves.toEqual('7469ef1f-98f0-460a-b3db-5ea31d9e80c0');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [*********************************0c0] from default`);
		});
		it('should return default value with partial show both', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), '7469ef1f-98f0-460a-b3db-5ea31d9e80c0', {showValue: 'prefix-suffix'});
			await expect(call).resolves.toEqual('7469ef1f-98f0-460a-b3db-5ea31d9e80c0');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [74********************************c0] from default`);
		});
		it('should return default value with partial show both', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser(), '7469ef1f-98f0-460a-b3db-5ea31d9e80c0', {showValue: false});
			await expect(call).resolves.toEqual('7469ef1f-98f0-460a-b3db-5ea31d9e80c0');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [************************************] from default`);
		});
	});
	describe('loaders', () => {
		it('should return process env value', async function () {
			process.env.TEST = 'asd';
			const call: Promise<string | undefined> = getConfigVariable('TEST', [env], stringParser(), undefined, {showValue: true});
			await expect(call).resolves.toEqual('asd');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd] from process.env.TEST`);
		});
		it('should return process react env value', async function () {
			process.env.REACT_APP_TEST = 'asd';
			const call: Promise<string | undefined> = getConfigVariable('TEST', [reactEnv], stringParser(), undefined, {showValue: true});
			await expect(call).resolves.toEqual('asd');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[react-env]: TEST [asd] from process.env.REACT_APP_TEST`);
		});
		describe('FetchConfigLoader', () => {
			beforeEach(function () {
				clearDefaultValueSeenMap();
				fetchLoader = new FetchConfigLoader(handleFetchRequest, fetchLoaderOptions);
				isFetchDisabled = false;
			});
			it('should return default if fetch request not ready yet', async function () {
				expect(fetchLoader.isLoaded()).to.be.eq(false);
				expect(await getConfigVariable('API_SERVER', [fetchLoader], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true})).to.be.eql(urlDefault);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: API_SERVER [${urlDefault}] from default`);
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq('FetchEnvConfig: fetch request not ready');
			});
			it('should return fetch URL value', async function () {
				const value = new URL(API_SERVER);
				const req = new Request(configRequestUrl);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchLoader], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
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
				const call = getConfigVariable('TEST_OBJECT', [fetchLoader], testObjectParser, undefined, {showValue: true});
				await call;
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: TEST_OBJECT [First=false;Second=false;Third=true] from ${configRequestUrl}`);
				expect(debugSpy.callCount).to.be.eq(3);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${configRequestUrl}`);
				expect(debugSpy.getCall(1).args[0]).to.be.an('string').and.eq(`returned cached response for FetchEnvConfig`);
				expect(debugSpy.getCall(2).args[0]).to.be.an('string').and.eq(`successfully loaded config from FetchEnvConfig`);
			});
			it('should not get null value', async function () {
				const req = new Request(configRequestUrl, {headers: {'If-None-Match': '123'}});
				fetchRequestData = req;
				expect(await getConfigVariable('NULL_VALUE', [fetchLoader], testObjectParser, undefined, {showValue: true})).to.be.eq(undefined);
				expect(infoSpy.callCount).to.be.eq(0);
			});
			it('should get cache hit', async function () {
				const value = new URL(API_SERVER);
				const req = new Request(configRequestUrl);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchLoader], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
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
				const call = getConfigVariable('API_SERVER', [fetchLoader], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(errorSpy.callCount).to.be.eq(0);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${value}] from ${configRequestUrl}`);
				expect(debugSpy.callCount).to.be.eq(4);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${configRequestUrl}`);
				expect(debugSpy.getCall(1).args[0]).to.be.an('string').and.eq(`client is offline, returned cached response for FetchEnvConfig`);
				expect(debugSpy.getCall(2).args[0]).to.be.an('string').and.eq(`storing response in cache for FetchEnvConfig`);
				expect(debugSpy.getCall(3).args[0]).to.be.an('string').and.eq(`successfully loaded config from FetchEnvConfig`);
				expect(output).to.be.eql(value);
			});
			it('should return default if fetch disabled', async function () {
				isFetchDisabled = true; // disable fetch
				isOnline = false;
				const req = new Request(configRequestUrl);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchLoader], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(errorSpy.callCount).to.be.eq(0);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: API_SERVER [http://localhost/api] from default`);
				expect(output).to.be.eql(urlDefault);
			});
			it('should reload fetch value when online', async function () {
				await fetchLoader.reload();
			});
		});
		describe('MemoryConfigLoader', () => {
			beforeEach(function () {
				clearDefaultValueSeenMap();
				memoryEnv = new MemoryConfigLoader(
					{
						TEST: undefined,
					},
					{logger: spyLogger},
				);
			});
			it('should return undefined value', async function () {
				const call: Promise<string | undefined> = getConfigVariable('TEST', [memoryEnv], stringParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(undefined);
				expect(infoSpy.callCount).to.be.eq(0);
			});
			it('should return memory env value', async function () {
				await memoryEnv.set('TEST', 'asd');
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.eq(`ConfigLoader[memory]: setting key TEST to 'asd'`);
				const call: Promise<string | undefined> = getConfigVariable('TEST', [memoryEnv], stringParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual('asd');
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[memory]: TEST [asd] from key:TEST`);
			});
			it('should return memory env value and changed value after first', async function () {
				await memoryEnv.set('TEST', 'asd');
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.eq(`ConfigLoader[memory]: setting key TEST to 'asd'`);
				const call1: Promise<string | undefined> = getConfigVariable('TEST', [memoryEnv], stringParser(), undefined, {showValue: true});
				await expect(call1).resolves.toEqual('asd');
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[memory]: TEST [asd] from key:TEST`);
				// update value
				await memoryEnv.set('TEST', 'asd2');
				expect(debugSpy.callCount).to.be.eq(2);
				expect(debugSpy.getCall(1).args[0]).to.be.eq(`ConfigLoader[memory]: setting key TEST to 'asd2'`);
				const call2: Promise<string | undefined> = getConfigVariable('TEST', [memoryEnv], stringParser(), undefined, {showValue: true});
				await expect(call2).resolves.toEqual('asd2');
				expect(infoSpy.callCount).to.be.eq(2);
				expect(infoSpy.getCall(1).args[0]).to.be.eq(`ConfigVariables[memory]: TEST [asd2] from key:TEST`);
			});
			it('should return memory env value and after reset undefined return from ENV', async function () {
				process.env.TEST = 'asd2';
				await memoryEnv.set('TEST', 'asd');
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.eq(`ConfigLoader[memory]: setting key TEST to 'asd'`);
				const call1: Promise<string | undefined> = getConfigVariable('TEST', [memoryEnv, env], stringParser(), undefined, {showValue: true});
				await expect(call1).resolves.toEqual('asd');
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[memory]: TEST [asd] from key:TEST`);
				await memoryEnv.set('TEST', undefined);
				const call2: Promise<string | undefined> = getConfigVariable('TEST', [memoryEnv, env], stringParser(), undefined, {showValue: true});
				await expect(call2).resolves.toEqual('asd2');
				expect(infoSpy.getCall(1).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd2] from process.env.TEST`);
			});
		});
	});
	describe('parsers', () => {
		describe('string', () => {
			it('should return process env string literal value', async function () {
				process.env.TEST = 'one';
				const optionSchema = z.enum(['one', 'two', 'three']);
				type Options = z.infer<typeof optionSchema>;
				const typeGuard = (value: unknown): value is Options => {
					return optionSchema.safeParse(value).success;
				};
				const value: Options | undefined = await getConfigVariable('TEST', [env], stringParser(typeGuard), undefined, {
					showValue: true,
				});
				expect(value).to.be.eq('one');
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [one] from process.env.TEST`);
			});
		});
		describe('boolean', () => {
			it('should return process env boolean true value', async function () {
				process.env.TEST = 'YES';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env, reactEnv], booleanParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(true);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [true] from process.env.TEST`);
			});
			it('should return process env boolean false value', async function () {
				process.env.TEST = 'N';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env, reactEnv], booleanParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(false);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [false] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env, reactEnv], booleanParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(undefined);
				const errorLog = errorSpy.getCall(0).args[0] as Error;
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[env](booleanParser): [__BROKEN__] value for key TEST'), errorLog.message);
			});
		});
		describe('integer', () => {
			it('should return process env integer value', async function () {
				process.env.TEST = '02';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env, reactEnv], integerParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(2);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [2] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env, reactEnv], integerParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(undefined);
				const errorLog = errorSpy.getCall(0).args[0] as Error;
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[env](integerParser): [__BROKEN__] value for key TEST'), errorLog.message);
			});
		});
		describe('float', () => {
			it('should return process env float value', async function () {
				process.env.TEST = '2.5';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env, reactEnv], floatParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(2.5);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [2.5] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env, reactEnv], floatParser(), undefined, {showValue: true});
				await expect(call).resolves.toEqual(undefined);
				const errorLog = errorSpy.getCall(0).args[0] as Error;
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[env](floatParser): [__BROKEN__] value for key TEST'), errorLog.message);
			});
		});
		describe('config', () => {
			it('should return process env config', async function () {
				process.env.TEST = 'foo=bar;baz=qux;secret=some-long-secret-value';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env, reactEnv],
					new SemicolonConfigParser({validate, protectedKeys: ['secret'], showProtectedKeys: 'prefix-suffix'}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).resolves.toEqual({foo: 'bar', baz: 'qux', secret: 'some-long-secret-value'});
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [foo=bar;baz=qux;secret=so******************ue] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env, reactEnv],
					new SemicolonConfigParser({validate, protectedKeys: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).resolves.toEqual(undefined);
				const errorLog = errorSpy.getCall(0).args[0] as Error;
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[env](semicolonConfigParser): [__BROKEN__]'), errorLog.message);
			});
		});
		describe('JSON', () => {
			it('should return process env json', async function () {
				process.env.TEST = '{"foo": "bar", "baz": "qux"}';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env, reactEnv],
					new JsonConfigParser({validate, protectedKeys: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).resolves.toEqual({foo: 'bar', baz: 'qux'});
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [{"foo":"bar","baz":"***"}] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<ObjectSchema | undefined> = getConfigVariable(
					'TEST',
					[env, reactEnv],
					new JsonConfigParser({validate, protectedKeys: ['baz']}),
					undefined,
					{
						showValue: true,
					},
				);
				await expect(call).resolves.toEqual(undefined);
				const errorLog = errorSpy.getCall(0).args[0] as Error;
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy((err: Error) => err.message.startsWith('variables[env](jsonConfigParser): [__BROKEN__] Unexpected token'), errorLog.message);
			});
		});
	});
});
