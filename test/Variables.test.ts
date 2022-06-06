import {expect} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as dotenv from 'dotenv';
import 'cross-fetch/polyfill';
import {ConfigVariables} from '../src/';
import {ReactEnvConfigLoader} from '../src/loaders/ReactEnvConfigLoader';
import {EnvConfigLoader} from '../src/loaders/EnvConfigLoader';
import {FetchConfigLoader} from '../src/loaders/FetchConfigLoader';

dotenv.config();
const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

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
	it('should return process react env value', async function () {
		process.env.REACT_APP_TEST = 'asd';
		const configVar = new ConfigVariables([new ReactEnvConfigLoader(), new EnvConfigLoader()], {
			logger: {
				info: infoSpy,
				debug: debugSpy,
				error: errorSpy,
				warn: warnSpy,
				trace: traceSpy,
			},
		});
		expect(await configVar.get('TEST', undefined, {showValue: true})).to.be.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[react_env]: TEST [asd] from process.env.REACT_APP_TEST`);
	});
	it('should return process env value', async function () {
		process.env.TEST = 'asd';
		const configVar = new ConfigVariables([new ReactEnvConfigLoader(), new EnvConfigLoader()], {
			logger: {
				info: infoSpy,
				debug: debugSpy,
				error: errorSpy,
				warn: warnSpy,
				trace: traceSpy,
			},
		});
		expect(await configVar.get('TEST', undefined, {showValue: true})).to.be.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[env]: TEST [asd] from process.env.TEST`);
	});
	itFetch('should return fetch value', async function () {
		const getConfigVariable = new ConfigVariables([new FetchConfigLoader(() => Promise.resolve(new Request('' + process.env.FETCH_URI)))], {
			logger: {
				info: infoSpy,
				debug: debugSpy,
				error: errorSpy,
				warn: warnSpy,
				trace: traceSpy,
			},
		}).get;
		expect(await getConfigVariable('API_SERVER', undefined, {sanitizeUrl: true})).to.be.eq(process.env.FETCH_API_SERVER);
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[fetch]: API_SERVER [${process.env.FETCH_API_SERVER}/] from ${process.env.FETCH_URI}`);
	});
});
