/* eslint-disable sonarjs/no-duplicate-string */
import 'cross-fetch/polyfill';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dotenv from 'dotenv';
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
	SemicolonConfigParser,
	setLogger,
	stringParser,
	UrlParser,
	ValidateCallback,
} from '../src/';
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

const reqCacheSetup: IRequestCache = {
	isOnline() {
		return isOnline;
	},
	storeRequest(req, res) {
		resCache.set(req.url, res.clone());
		return Promise.resolve();
	},
	fetchRequest(req) {
		return Promise.resolve(resCache.get(req.url));
	},
};

const spyLogger = {
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
};

setLogger(spyLogger);

const objectSchema = z.object({
	foo: z.string(),
	baz: z.string(),
});
type ObjectSchema = z.infer<typeof objectSchema>;

const validate: ValidateCallback<ObjectSchema, Record<string, unknown>> = async (data: Record<string, unknown>) => {
	return objectSchema.parseAsync(data);
};

const stringRecordSchema = z.record(z.string().min(1), z.string().nullable());

const fetchValidate: ValidateCallback<Record<string, string | null>, Record<string, unknown>> = async (data: Record<string, unknown>) => {
	return stringRecordSchema.parseAsync(data);
};

let fetchEnv: (params?: string | undefined) => IConfigLoader;
const urlDefault = new URL('http://localhost/api');
let fetchRequestData: Request | undefined;
function handleFetchRequest() {
	if (fetchRequestData) {
		return fetchRequestData;
	}
	return createRequestNotReady('fetch request not ready');
}

describe('config variable', () => {
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
		const call: Promise<string> = getConfigVariable('TEST', [], stringParser, 'some_value', {showValue: true});
		await expect(call).to.be.eventually.eq('some_value');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
	});
	describe('default values', () => {
		it('should return default value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser, 'some_value', {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default promise value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser, Promise.resolve('some_value'), {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default callback value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser, () => 'some_value', {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
		it('should return default callback promise value', async function () {
			const call: Promise<string> = getConfigVariable('TEST', [], stringParser, () => Promise.resolve('some_value'), {showValue: true});
			await expect(call).to.be.eventually.eq('some_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
		});
	});
	describe('loaders', () => {
		it('should return process env value', async function () {
			process.env.TEST = 'asd';
			const call: Promise<string | undefined> = getConfigVariable('TEST', [env()], stringParser, undefined, {showValue: true});
			await expect(call).to.be.eventually.eq('asd');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd] from process.env.TEST`);
		});
		it('should return process react env value', async function () {
			process.env.REACT_APP_TEST = 'asd';
			const call: Promise<string | undefined> = getConfigVariable('TEST', [reactEnv()], stringParser, undefined, {showValue: true});
			await expect(call).to.be.eventually.eq('asd');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[react-env]: TEST [asd] from process.env.REACT_APP_TEST`);
		});
		describe('FetchConfigLoader', () => {
			before(function () {
				if (!process.env.FETCH_URI || !process.env.FETCH_API_SERVER) {
					this.skip();
				}
				fetchEnv = new FetchConfigLoader(handleFetchRequest, {validate: fetchValidate, logger: spyLogger, cache: reqCacheSetup}).getLoader;
			});
			it('should return default if fetch request not ready yet', async function () {
				expect(await getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true})).to.be.eql(urlDefault);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: API_SERVER [${urlDefault}] from default`);
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq('FetchEnvConfig: fetch request not ready');
			});
			it('should return fetch value', async function () {
				const src = new URL('' + process.env.FETCH_URI);
				const value = new URL('' + process.env.FETCH_API_SERVER);
				const req = new Request(src);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${value}] from ${src}`);
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${src}`);
				expect(output).to.be.eql(value);
			});
			it('should return cached fetch value when offline', async function () {
				isOnline = false;
				fetchEnv = new FetchConfigLoader(handleFetchRequest, {validate: fetchValidate, logger: spyLogger, cache: reqCacheSetup}).getLoader;
				const src = new URL('' + process.env.FETCH_URI);
				const value = new URL('' + process.env.FETCH_API_SERVER);
				const req = new Request(src);
				fetchRequestData = req;
				const call = getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), urlDefault, {showValue: true});
				const output = await call;
				expect(errorSpy.callCount, errorSpy.getCall(0)?.args.join(' ')).to.be.eq(0);
				expect(infoSpy.callCount).to.be.eq(1);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${value}] from ${src}`);
				expect(debugSpy.callCount).to.be.eq(1);
				expect(debugSpy.getCall(0).args[0]).to.be.an('string').and.eq(`fetching config from ${src}`);
				expect(output).to.be.eql(value);
			});
		});
	});
	describe('parsers', () => {
		describe('boolean', () => {
			it('should return process env boolean true value', async function () {
				process.env.TEST = 'YES';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env(), reactEnv()], booleanParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(true);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [true] from process.env.TEST`);
			});
			it('should return process env boolean false value', async function () {
				process.env.TEST = 'N';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env(), reactEnv()], booleanParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(false);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [false] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<boolean | undefined> = getConfigVariable('TEST', [env(), reactEnv()], booleanParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy(
						(err: Error) => err.message.startsWith('variables[booleanParser]: [__BROKEN__] value for key TEST is not valid boolean string'),
						errorLog.message,
					);
			});
		});
		describe('integer', () => {
			it('should return process env integer value', async function () {
				process.env.TEST = '02';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], integerParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(2);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [2] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], integerParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy(
						(err: Error) => err.message.startsWith('variables[integerParser]: [__BROKEN__] value for key TEST is not a valid integer'),
						errorLog.message,
					);
			});
		});
		describe('float', () => {
			it('should return process env float value', async function () {
				process.env.TEST = '2.5';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], floatParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(2.5);
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [2.5] from process.env.TEST`);
			});
			it('should return undefined value if not valid', async function () {
				process.env.TEST = '__BROKEN__';
				const call: Promise<number | undefined> = getConfigVariable('TEST', [env(), reactEnv()], floatParser, undefined, {showValue: true});
				await expect(call).to.be.eventually.eq(undefined);
				const errorLog = errorSpy.getCall(0).args[0];
				expect(errorLog)
					.to.be.instanceOf(Error)
					.and.satisfy(
						(err: Error) => err.message.startsWith('variables[floatParser]: [__BROKEN__] value for key TEST is not a valid float'),
						errorLog.message,
					);
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
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [foo=bar] from process.env.TEST`);
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
				expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [{"foo":"bar"}] from process.env.TEST`);
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
