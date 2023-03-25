import * as chai from 'chai';
import 'mocha';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as dotenv from 'dotenv';
import * as z from 'zod';
import {URL} from 'url';
import 'cross-fetch/polyfill';
import {
	env,
	FetchConfigLoader,
	getConfigVariable,
	JsonConfigParser,
	reactEnv,
	SemicolonConfigParser,
	setLogger,
	stringParser,
	UrlParser,
	ValidateCallback,
} from '../src/';

chai.use(chaiAsPromised);

const expect = chai.expect;

dotenv.config();
const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

setLogger({
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
});

const objectSchema = z.object({
	foo: z.string(),
	baz: z.string(),
});
type ObjectSchema = z.infer<typeof objectSchema>;

const validate: ValidateCallback<ObjectSchema> = async (data: ObjectSchema) => {
	const result = await objectSchema.safeParseAsync(data);
	if (!result.success) {
		return {success: false, message: result.error.message};
	}
	return {success: true};
};

const stringRecordSchema = z.record(z.string().min(1), z.string());

const fetchValidate: ValidateCallback<Record<string, string>> = async (data: Record<string, string>) => {
	const result = await stringRecordSchema.safeParseAsync(data);
	if (!result.success) {
		return {success: false, message: result.error.message};
	}
	return {success: true};
};

const itFetch = process.env.FETCH_URI ? it : it.skip;

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
		const call: Promise<string> = getConfigVariable('TEST', [env(), reactEnv()], stringParser, 'some_value', {showValue: true});
		await expect(call).to.be.eventually.eq('some_value');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
	});
	it('should return process react env value', async function () {
		process.env.REACT_APP_TEST = 'asd';
		const call: Promise<string | undefined> = getConfigVariable('TEST', [env(), reactEnv()], stringParser, undefined, {showValue: true});
		await expect(call).to.be.eventually.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[react-env]: TEST [asd] from process.env.REACT_APP_TEST`);
	});
	it('should return process env value', async function () {
		process.env.TEST = 'asd';
		const call: Promise<string | undefined> = getConfigVariable('TEST', [env(), reactEnv()], stringParser, undefined, {showValue: true});
		await expect(call).to.be.eventually.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd] from process.env.TEST`);
	});
	itFetch('should return fetch value', async function () {
		const fetchEnv = new FetchConfigLoader(() => Promise.resolve(new Request('' + process.env.FETCH_URI)), {validate: fetchValidate}).getLoader;
		expect(await getConfigVariable('API_SERVER', [fetchEnv()], new UrlParser({urlSanitize: true}), undefined, {showValue: true})).to.be.eql(
			new URL(process.env.FETCH_API_SERVER || ''),
		);
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${process.env.FETCH_API_SERVER}/] from ${process.env.FETCH_URI}`);
	});
	it('should return process env config', async function () {
		process.env.TEST = 'foo=bar;baz=qux';
		const call: Promise<ObjectSchema | undefined> = getConfigVariable('TEST', [env()], new SemicolonConfigParser({validate, keysToHide: ['baz']}), undefined, {
			showValue: true,
		});
		await expect(call).to.be.eventually.eql({foo: 'bar', baz: 'qux'});
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [foo=bar] from process.env.TEST`);
	});
	it('should return process env json', async function () {
		process.env.TEST = '{"foo": "bar", "baz": "qux"}';
		const call: Promise<ObjectSchema | undefined> = getConfigVariable('TEST', [env()], new JsonConfigParser({validate, keysToHide: ['baz']}), undefined, {
			showValue: true,
		});
		await expect(call).to.be.eventually.eql({foo: 'bar', baz: 'qux'});
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [{"foo":"bar"}] from process.env.TEST`);
	});
});
