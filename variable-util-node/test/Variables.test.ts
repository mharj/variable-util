/* eslint-disable no-unused-expressions */
import 'mocha';
import * as path from 'path';
import * as sinon from 'sinon';
import {ConfigMap, getConfigVariable, setLogger, stringParser} from '@avanio/variable-util';
import {DockerSecretsConfigLoader, FileConfigLoader} from '../src';
import {expect} from 'chai';
import {ILoggerLike} from '@avanio/logger-like';

const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

const testLogger: ILoggerLike = {
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
};

setLogger(testLogger);

const jsonFilename = './test/testSettings.json';

describe('config variable', () => {
	beforeEach(() => {
		debugSpy.resetHistory();
		infoSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		traceSpy.resetHistory();
	});
	describe('File loader', () => {
		it('should return file variable value, filename from string', async function () {
			const fileEnv = new FileConfigLoader({fileName: jsonFilename, type: 'json'}).getLoader;
			const fileDevEnv = new FileConfigLoader({fileName: './test/testDevSettings.json', type: 'json', disabled: true}).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileDevEnv(), fileEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from promise', async function () {
			const fileEnv = new FileConfigLoader(Promise.resolve({fileName: jsonFilename, type: 'json'})).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from callback', async function () {
			const fileEnv = new FileConfigLoader(() => ({fileName: jsonFilename, type: 'json'})).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from callback Promise', async function () {
			const fileEnv = new FileConfigLoader(async () => ({fileName: jsonFilename, type: 'json'})).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from promise callback', async function () {
			const fileEnv = new FileConfigLoader(async () => ({fileName: jsonFilename, type: 'json'})).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const fileEnv = new FileConfigLoader({fileName: './test/testSettings99.json', isSilent: false, type: 'json'}).getLoader;
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv()], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(errorSpy.calledOnce).to.be.true;
		});

		it('should fail to load not existing file', async function () {
			const fileEnv = new FileConfigLoader({fileName: '.undefined', isSilent: false, logger: testLogger, type: 'json'}).getLoader;
			const mapper = new ConfigMap<{demo: string}>({
				demo: {loaders: [fileEnv()], parser: stringParser(), undefinedThrowsError: true},
			});
			const res = await mapper.getResult('demo');
			expect(() => res.unwrap()).to.throw('ConfigMap key demo is undefined');
			expect(errorSpy.getCall(0).args[0].message).to.be.eq(`ConfigLoader[file]: file .undefined not found`);
		});
		it('should fail to load non JSON file', async function () {
			const fileEnv = new FileConfigLoader({fileName: './test/test.txt', isSilent: false, logger: testLogger, type: 'json'}).getLoader;
			const mapper = new ConfigMap<{demo: string}>({
				demo: {loaders: [fileEnv()], parser: stringParser(), undefinedThrowsError: true},
			});
			const res = await mapper.getResult('demo');
			expect(() => res.unwrap()).to.throw('ConfigMap key demo is undefined');
			expect(errorSpy.getCall(0).args[0].message).to.be.eq(`ConfigLoader[file]: file ./test/test.txt is not a valid JSON`);
		});
	});
	describe('Docker Secrets loader', () => {
		it('should return docker secret value force lowercase key', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test', fileLowerCase: true}).getLoader;
			expect(await getConfigVariable('DOCKERSECRET1', [dockerEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('docker_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(
				`ConfigVariables[docker-secrets]: DOCKERSECRET1 [docker_value] from ${path.join(path.resolve('./test/'), 'dockersecret1')}`,
			);
		});
		it('should return docker secret value', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test'}).getLoader;
			expect(await getConfigVariable('dockersecret2', [dockerEnv()], stringParser(), undefined, {showValue: true})).to.be.eq('docker_value');
			expect(infoSpy.getCall(0).args[0]).to.be.eq(
				`ConfigVariables[docker-secrets]: dockersecret2 [docker_value] from ${path.join(path.resolve('./test/'), 'dockersecret2')}`,
			);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test', fileLowerCase: true, isSilent: false}).getLoader;
			expect(await getConfigVariable('DOCKERSECRET99', [dockerEnv()], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(errorSpy.calledOnce).to.be.true;
		});
	});
});
