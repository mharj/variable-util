import type {ILoggerLike} from '@avanio/logger-like';
import {clearDefaultValueSeenMap, ConfigMap, setLogger, stringParser} from '@avanio/variable-util';
import {spy} from 'sinon';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {ViteEnvConfigLoader} from '../src/index.js';

const logSpy = spy();

const spyLogger = {
	debug: logSpy,
	error: logSpy,
	info: logSpy,
	trace: logSpy,
	warn: logSpy,
} satisfies ILoggerLike;

const loaders = [new ViteEnvConfigLoader()];

type TestConfig = {
	TEST: string | undefined;
	_NOT_EXISTS: string | undefined;
};

export const testConfig = new ConfigMap<TestConfig>(
	{
		TEST: {parser: stringParser(), params: {showValue: true}},
		_NOT_EXISTS: {parser: stringParser(), params: {showValue: true}},
	},
	loaders,
);

describe('config variable', () => {
	beforeAll(() => {
		setLogger(spyLogger);
	});
	beforeEach(() => {
		clearDefaultValueSeenMap();
		logSpy.resetHistory();
		import.meta.env.VITE_TEST = undefined;
	});
	describe('loaders', () => {
		it('should return import meta env value', async function () {
			import.meta.env.VITE_TEST = 'asd';
			const call: Promise<string | undefined> = testConfig.get('TEST');
			await expect(call).resolves.toEqual('asd');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[vite-env]: TEST [asd] from import.meta.env.VITE_TEST`);
		});
		it('should return undefined if not found', async function () {
			const call: Promise<string | undefined> = testConfig.get('_NOT_EXISTS');
			await expect(call).resolves.toEqual(undefined);
		});
	});
});
