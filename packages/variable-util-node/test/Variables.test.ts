import type {ILoggerLike} from '@avanio/logger-like';
import {booleanParser, ConfigMap, getConfigVariable, integerParser, setLogger, stringParser, type ValidateCallback} from '@avanio/variable-util';
import * as fs from 'fs';
import * as path from 'path';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {z} from 'zod';
import {DockerSecretsConfigLoader, DotEnvLoader, FileConfigLoader} from '../src';

const logSpy = vi.fn();

const testLogger: ILoggerLike = {
	debug: logSpy,
	error: logSpy,
	info: logSpy,
	trace: logSpy,
	warn: logSpy,
};

setLogger(testLogger);

const jsonFilename = `${__dirname}/testSettings.json`;

const stringRecordSchema = z.record(z.string().min(1), z.string());
const validate: ValidateCallback<unknown, Record<string, string>> = (data) => {
	return stringRecordSchema.parse(data);
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('config variable', () => {
	beforeEach(() => {
		logSpy.mockClear();
	});
	describe('File loader', () => {
		it('should return file variable value, filename from string', async function () {
			const fileEnv = new FileConfigLoader({fileName: jsonFilename, validate, watch: true});
			const fileDevEnv = new FileConfigLoader({disabled: true, fileName: `${__dirname}/testDevSettings.json`});
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileDevEnv, fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(await getConfigVariable('SETTINGS_VARIABLE3', [fileDevEnv, fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(true); // src: boolean
			expect(await getConfigVariable('SETTINGS_VARIABLE4', [fileDevEnv, fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(true); // src: string format
			expect(await getConfigVariable('SETTINGS_VARIABLE5', [fileDevEnv, fileEnv], integerParser(), undefined, {showValue: true})).to.be.eq(1); // src: number
			expect(await getConfigVariable('SETTINGS_VARIABLE6', [fileDevEnv, fileEnv], integerParser(), undefined, {showValue: true})).to.be.eq(1); // src: string format
			expect(await getConfigVariable('SETTINGS_VARIABLE7', [fileDevEnv, fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(false); // src: string format
			expect(await getConfigVariable('SETTINGS_VARIABLE8', [fileDevEnv, fileEnv], booleanParser(), undefined, {showValue: true})).to.be.eq(false); // src: string format
			expect(await getConfigVariable('SETTINGS_VARIABLE_NULL', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(await getConfigVariable('NOT_EXISTS', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[1][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE3 [true] from ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[2][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE4 [true] from ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[3][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE5 [1] from ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[4][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE6 [1] from ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[5][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE7 [false] from ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[6][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE8 [false] from ${__dirname}/testSettings.json`);
			// touch ${__dirname}/testSettings.json
			// wait for file change
			// expect the file to be reloaded
			fs.utimesSync(jsonFilename, new Date(), new Date());
			await sleep(1000);
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.mock.calls[7][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
		});
		it('should logging file watcher', async function () {
			const fileEnv = new FileConfigLoader({fileName: jsonFilename, logger: testLogger, watch: true});
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigLoader[file]: loading file ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[1][0]).to.be.eq(`ConfigLoader[file]: opening file watcher for ${__dirname}/testSettings.json`);
			expect(logSpy.mock.calls[2][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
			await fileEnv.reload();
			expect(logSpy.mock.calls[3][0]).to.be.eq(`ConfigLoader[file]: loading file ${__dirname}/testSettings.json`);
			await fileEnv.close();
			expect(logSpy.mock.calls[4][0]).to.be.eq(`ConfigLoader[file]: closing file watcher for ${__dirname}/testSettings.json`);
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
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
		});
		it('should return file variable value, filename from callback', async function () {
			const fileEnv = new FileConfigLoader(() => ({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
		});
		it('should return file variable value, filename from callback Promise', async function () {
			const fileEnv = new FileConfigLoader(() => Promise.resolve({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
		});
		it('should return file variable value, filename from promise callback', async function () {
			const fileEnv = new FileConfigLoader(() => Promise.resolve({fileName: jsonFilename}));
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq('settings_file');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[file]: SETTINGS_VARIABLE1 [settings_file] from ${__dirname}/testSettings.json`);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const fileEnv = new FileConfigLoader({fileName: `${__dirname}/testSettings99.json`, isSilent: false});
			expect(await getConfigVariable('SETTINGS_VARIABLE1', [fileEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.mock.calls.length).to.be.eq(1);
		});

		it('should fail to load not existing file', async function () {
			const fileEnv = new FileConfigLoader({fileName: '.undefined', isSilent: false, logger: testLogger});
			const mapper = new ConfigMap<{demo: string}>(
				{
					demo: {parser: stringParser(), undefinedThrowsError: true},
				},
				[fileEnv],
			);
			const res = await mapper.getResult('demo');
			expect(() => res.unwrap()).to.throw('ConfigMap key demo is undefined');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigLoader[file]: loading file .undefined`);
			expect((logSpy.mock.calls[1][0] as Error).message).to.include(`ConfigLoader[file]: ENOENT: no such file or directory`);
		});
		it('should fail to load non JSON file', async function () {
			const fileEnv = new FileConfigLoader({fileName: `${__dirname}/test.txt`, isSilent: false, logger: testLogger});
			const mapper = new ConfigMap<{demo: string}>(
				{
					demo: {parser: stringParser(), undefinedThrowsError: true},
				},
				[fileEnv],
			);
			const res = await mapper.getResult('demo');
			expect(() => res.unwrap()).to.throw('ConfigMap key demo is undefined');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigLoader[file]: loading file ${__dirname}/test.txt`);
			expect((logSpy.mock.calls[1][0] as Error).message).to.be.eq(`ConfigLoader[file]: file ${__dirname}/test.txt is not a valid json`);
		});
		it('should get empty value if disabled', async function () {
			const fileEnv = new FileConfigLoader({disabled: true, fileName: jsonFilename, isSilent: false, logger: testLogger});
			const data = await fileEnv.getLoaderResult('SETTINGS_VARIABLE1');
			expect(data).to.be.eql({
				path: `${__dirname}/testSettings.json`,
				seen: false,
				value: 'settings_file',
			});
		});
	});
	describe('Docker Secrets loader', () => {
		it('should return docker secret value force lowercase key', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({fileLowerCase: true, path: `${__dirname}`});
			expect(await getConfigVariable('DOCKERSECRET1', [dockerEnv], stringParser(), undefined, {showValue: true})).to.be.eq('docker_value');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[docker-secrets]: DOCKERSECRET1 [docker_value] from ${path.join(__dirname, 'dockersecret1')}`);
		});
		it('should return docker secret value', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({path: `${__dirname}`});
			expect(await getConfigVariable('dockersecret2', [dockerEnv], stringParser(), undefined, {showValue: true})).to.be.eq('docker_value');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[docker-secrets]: dockersecret2 [docker_value] from ${path.join(__dirname, 'dockersecret2')}`);
		});
		it('should return error when isSilent = false and file not exists', async function () {
			const dockerEnv = new DockerSecretsConfigLoader({fileLowerCase: true, isSilent: false, path: `${__dirname}`});
			expect(await getConfigVariable('DOCKERSECRET99', [dockerEnv], stringParser(), undefined, {showValue: true})).to.be.eq(undefined);
			expect(logSpy.mock.calls.length).to.be.eq(1);
		});
	});
	describe('DotEnv loader', () => {
		it('should return dotenv variable value', async function () {
			const dotEnvEnv = new DotEnvLoader({fileName: `${__dirname}/.testEnv`});
			expect(await getConfigVariable('HOSTNAME', [dotEnvEnv], stringParser(), undefined, {showValue: true})).to.be.eq('dotenv.demo.com');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[dotenv]: HOSTNAME [dotenv.demo.com] from ${__dirname}/.testEnv`);
		});
	});
});
