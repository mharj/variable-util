/* eslint-disable no-unused-expressions */
import * as path from 'path';
import {getConfigVariable, setLogger, stringParser} from '@avanio/variable-util';
import {expect} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import {DockerSecretsConfigLoader, FileConfigLoader} from '../src';

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

describe('config variable', () => {
	beforeEach(() => {
		debugSpy.resetHistory();
		infoSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		traceSpy.resetHistory();
	});
	describe('docker secrets', () => {
		it('should return file variable value', async function () {
			const fileEnv = new FileConfigLoader({fileName: './test/testSettings.json', type: 'json'}).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser, undefined, {showValue: true})).to.be.eq('settings_file');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const fileEnv = new FileConfigLoader({fileName: './test/testSettings99.json', isSilent: false, type: 'json'}).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser, undefined, {showValue: true})).to.be.eq(undefined);
			expect(errorSpy.calledOnce).to.be.true;
		});
	});
	describe('docker secrets', () => {
		it('should return docker secret value force lowercase key', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test', fileLowerCase: true}).getLoader;
			expect(await getConfigVariable('DOCKERSECRET1', [dockerEnv()], stringParser, undefined, {showValue: true})).to.be.eq('docker_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(
				`ConfigVariables[docker-secrets]: DOCKERSECRET1 [docker_value] from ${path.join(path.resolve('./test/'), 'dockersecret1')}`,
			);
		});
		it('should return docker secret value', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test'}).getLoader;
			expect(await getConfigVariable('dockersecret2', [dockerEnv()], stringParser, undefined, {showValue: true})).to.be.eq('docker_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(
				`ConfigVariables[docker-secrets]: dockersecret2 [docker_value] from ${path.join(path.resolve('./test/'), 'dockersecret2')}`,
			);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test', fileLowerCase: true, isSilent: false}).getLoader;
			expect(await getConfigVariable('DOCKERSECRET99', [dockerEnv()], stringParser, undefined, {showValue: true})).to.be.eq(undefined);
			expect(errorSpy.calledOnce).to.be.true;
		});
	});
});
