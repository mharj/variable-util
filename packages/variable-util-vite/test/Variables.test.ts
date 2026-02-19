import type {ILoggerLike} from '@avanio/logger-like';
import {ConfigMap, clearDefaultValueSeenMap, setLogger, stringParser} from '@avanio/variable-util';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {ViteEnvConfigLoader} from '../src/index.js';

const logSpy = vi.fn();

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
		_NOT_EXISTS: {params: {showValue: true}, parser: stringParser()},
		TEST: {params: {showValue: true}, parser: stringParser()},
	},
	loaders,
);

describe('config variable', () => {
	beforeAll(() => {
		setLogger(spyLogger);
	});
	beforeEach(() => {
		clearDefaultValueSeenMap();
		logSpy.mockClear();
		import.meta.env.VITE_TEST = undefined;
	});
	describe('loaders', () => {
		it('should return import meta env value', async function () {
			import.meta.env.VITE_TEST = 'asd';
			const call: Promise<string | undefined> = testConfig.get('TEST');
			await expect(call).resolves.toEqual('asd');
			expect(logSpy.mock.calls[0][0]).to.be.eq(`ConfigVariables[vite-env]: TEST [asd] from import.meta.env.VITE_TEST`);
		});
		it('should return undefined if not found', async function () {
			const call: Promise<string | undefined> = testConfig.get('_NOT_EXISTS');
			await expect(call).resolves.toEqual(undefined);
		});
	});
});
