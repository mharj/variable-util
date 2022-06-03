import {expect} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import {Variables} from '../src/';
import {ReactEnvConfig} from '../src/configs/reactConfig';
import {EnvConfig} from '../src/configs/envConfig';

const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

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
		const configVar = new Variables([new ReactEnvConfig(), new EnvConfig()], {
			logger: {
				info: infoSpy,
				debug: debugSpy,
				error: errorSpy,
				warn: warnSpy,
				trace: traceSpy,
			},
		});
		expect(await configVar.get('TEST', undefined, {showValue: true})).to.be.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`variables: TEST [TEST] from process.env.REACT_APP_TEST`);
	});
	it('should return process env value', async function () {
		process.env.TEST = 'asd';
		const configVar = new Variables([new ReactEnvConfig(), new EnvConfig()], {
			logger: {
				info: infoSpy,
				debug: debugSpy,
				error: errorSpy,
				warn: warnSpy,
				trace: traceSpy,
			},
		});
		expect(await configVar.get('TEST', undefined, {showValue: true})).to.be.eq('asd');
		expect(infoSpy.getCall(0).args[0]).to.be.eq(`variables: TEST [TEST] from process.env.TEST`);
	});
});
