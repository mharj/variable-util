import {expect} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as dotenv from 'dotenv';
import 'cross-fetch/polyfill';
import {setLogger, getConfigVariable} from '../src/';
import {reactEnv} from '../src/loaders/ReactEnvConfigLoader';
import {env} from '../src/loaders/EnvConfigLoader';
import {FetchConfigLoader} from '../src/loaders/FetchConfigLoader';

dotenv.config();
const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

setLogger({
	info: infoSpy,
	debug: debugSpy,
	error: errorSpy,
	warn: warnSpy,
	trace: traceSpy,
});

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
		expect(await getConfigVariable('TEST', [env(), reactEnv()], 'some_value', {showValue: true})).to.be.eq('some_value');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[default]: TEST [some_value] from default`);
	});
	it('should return process react env value', async function () {
		process.env.REACT_APP_TEST = 'asd';
		expect(await getConfigVariable('TEST', [env(), reactEnv()], undefined, {showValue: true})).to.be.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[react-env]: TEST [asd] from process.env.REACT_APP_TEST`);
	});
	it('should return process env value', async function () {
		process.env.TEST = 'asd';
		expect(await getConfigVariable('TEST', [env(), reactEnv()], undefined, {showValue: true})).to.be.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd] from process.env.TEST`);
	});
	itFetch('should return fetch value', async function () {
		const fetchEnv = new FetchConfigLoader(() => Promise.resolve(new Request('' + process.env.FETCH_URI))).getLoader;
		expect(await getConfigVariable('API_SERVER', [fetchEnv()], undefined, {sanitizeUrl: true})).to.be.eq(process.env.FETCH_API_SERVER);
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${process.env.FETCH_API_SERVER}/] from ${process.env.FETCH_URI}`);
	});
});
