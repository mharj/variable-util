import * as path from 'path';
import type {ILoggerLike} from '@avanio/logger-like';
import {booleanParser, ConfigMap, getConfigVariable, integerParser, setLogger, stringParser} from '@avanio/variable-util';
import {spy} from 'sinon';
import {beforeEach, describe, expect, it} from 'vitest';
import {DockerSecretsConfigLoader, DotEnvLoader, FileConfigLoader} from '../src';

const logSpy = spy();

const testLogger: ILoggerLike = {
	debug: logSpy,
	error: logSpy,
	info: logSpy,
	trace: logSpy,
	warn: logSpy,
};

setLogger(testLogger);

const jsonFilename = './test/testSettings.json';

describe('config variable', () => {
	beforeEach(() => {
		logSpy.resetHistory();
	});
	describe('File loader', () => {
		it('should return file variable value, filename from string', async function () {
			const fileEnv = new FileConfigLoader({fileName: jsonFilename});
			const fileDevEnv = new FileConfigLoader({fileName: './test/testDevSettings.json', disabled: true});
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileDevEnv, fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(await getConfigVariable('SETTINGS_VARIABLE3', [fileDevEnv, fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(true); // src: boolean
			expect(await getConfigVariable('SETTINGS_VARIABLE4', [fileDevEnv, fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(true); // src: string format
			expect(await getConfigVariable('SETTINGS_VARIABLE5', [fileDevEnv, fileEnv], integerParser(), undefined, {showValue: true})).to.be.eq(1); // src: number
			expect(await getConfigVariable('SETTINGS_VARIABLE6', [fileDevEnv, fileEnv], integerParser(), undefined, {showValue: true})).to.be.eq(1); // src: string format
			expect(await getConfigVariable('SETTINGS_VARIABLE_NULL', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(await getConfigVariable('NOT_EXISTS', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
			expect(logSpy.getCall(1).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE3 [true] from ./test/testSettings.json`);
			expect(logSpy.getCall(2).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE4 [true] from ./test/testSettings.json`);
			expect(logSpy.getCall(3).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE5 [1] from ./test/testSettings.json`);
			expect(logSpy.getCall(4).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE6 [1] from ./test/testSettings.json`);
		});
		it('should logging file watcher', async function () {
			const fileEnv = new FileConfigLoader({fileName: jsonFilename, logger: testLogger, watch: true});
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigLoader[file]: loading file ./test/testSettings.json`);
			expect(logSpy.getCall(1).args[0]).to.be.eq(`ConfigLoader[file]: opening file watcher for ./test/testSettings.json`);
			expect(logSpy.getCall(2).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
			await fileEnv.reload();
			expect(logSpy.getCall(3).args[0]).to.be.eq(`ConfigLoader[file]: loading file ./test/testSettings.json`);
			await fileEnv.close();
			expect(logSpy.getCall(4).args[0]).to.be.eq(`ConfigLoader[file]: closing file watcher for ./test/testSettings.json`);
		});
		it('should return file variable value, filename from promise', async function () {
			const fileEnv = new FileConfigLoader(Promise.resolve({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(await getConfigVariable('SETTINGS_VARIABLE2', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(await getConfigVariable('SETTINGS_VARIABLE3', [fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(true);
			expect(await getConfigVariable('SETTINGS_VARIABLE4', [fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(true);
			expect(await getConfigVariable('SETTINGS_VARIABLE5', [fileEnv], integerParser(), undefined, {showValue: true})).to.be.eq(1);
			expect(await getConfigVariable('SETTINGS_VARIABLE6', [fileEnv], integerParser(), undefined, {showValue: true})).to.be.eq(1);
			expect(await getConfigVariable('SETTINGS_VARIABLE_NULL', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(await getConfigVariable('NOT_EXISTS', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from callback', async function () {
			const fileEnv = new FileConfigLoader(() => ({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from callback Promise', async function () {
			const fileEnv = new FileConfigLoader(() => Promise.resolve({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return file variable value, filename from promise callback', async function () {
			const fileEnv = new FileConfigLoader(() => Promise.resolve({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ./test/testSettings.json`);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const fileEnv = new FileConfigLoader({fileName: './test/testSettings99.json', isSilent: false});
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.calledOnce).to.be.eq(true);
		});

		it('should fail to load not existing file', async function () {
			const fileEnv = new FileConfigLoader({fileName: '.undefined', isSilent: false, logger: testLogger});
			const mapper = new ConfigMap<{demo: string}>({
				demo: {loaders: [fileEnv], parser: stringParser(), undefinedThrowsError: true},
			});
			const res = await mapper.getResult('demo');
			expect(() => res.unwrap()).to.throw('ConfigMap key demo is undefined');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigLoader[file]: loading file .undefined`);
			expect((logSpy.getCall(1).args[0] as Error).message).to.be.eq(`ConfigLoader[file]: file .undefined not found`);
		});
		it('should fail to load non JSON file', async function () {
			const fileEnv = new FileConfigLoader({fileName: './test/test.txt', isSilent: false, logger: testLogger});
			const mapper = new ConfigMap<{demo: string}>({
				demo: {loaders: [fileEnv], parser: stringParser(), undefinedThrowsError: true},
			});
			const res = await mapper.getResult('demo');
			expect(() => res.unwrap()).to.throw('ConfigMap key demo is undefined');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigLoader[file]: loading file ./test/test.txt`);
			expect((logSpy.getCall(1).args[0] as Error).message).to.be.eq(`ConfigLoader[file]: file ./test/test.txt is not a valid json`);
		});
		it('should get empty value if disabled', async function () {
			const fileEnv = new FileConfigLoader({disabled: true, fileName: jsonFilename, isSilent: false, logger: testLogger});
			const data = await fileEnv.getLoaderResult('SETTINGS_VARIABLE1');
			expect(data).to.be.eql({
				path: './test/testSettings.json',
				seen: false,
				value: 'settings_file',
			});
		});
	});
	describe('Docker Secrets loader', () => {
		it('should return docker secret value force lowercase key', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test', fileLowerCase: true});
			expect(await getConfigVariable('DOCKERSECRET1', [dockerEnv], stringParser(), undefined, {showValue: true})).to.be.eq('docker_value');
			expect(logSpy.getCall(0).args[0]).to.be.eq(
				`ConfigVariables[docker-secrets]: DOCKERSECRET1 [docker_value] from ${path.join(path.resolve('./test/'), 'dockersecret1')}`,
			);
		});
		it('should return docker secret value', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test'});
			expect(await getConfigVariable('dockersecret2', [dockerEnv], stringParser(), undefined, {showValue: true})).to.be.eq('docker_value');
			expect(logSpy.getCall(0).args[0]).to.be.eq(
				`ConfigVariables[docker-secrets]: dockersecret2 [docker_value] from ${path.join(path.resolve('./test/'), 'dockersecret2')}`,
			);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: './test', fileLowerCase: true, isSilent: false});
			expect(await getConfigVariable('DOCKERSECRET99', [dockerEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.calledOnce).to.be.eq(true);
		});
	});
	describe('DotEnv loader', () => {
		it('should return dotenv variable value', async function () {
			const dotEnvEnv = new DotEnvLoader({fileName: './test/.testEnv'});
			expect(await getConfigVariable('HOSTNAME', [dotEnvEnv], stringParser(), undefined, {showValue: true})).to.be.eq('dotenv.demo.com');
			expect(logSpy.getCall(0).args[0]).to.be.eq('ConfigVariables[dotenv]: HOSTNAME [dotenv.demo.com] from ./test/.testEnv');
		});
	});
});
