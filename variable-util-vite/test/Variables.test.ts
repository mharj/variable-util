import type {ILoggerLike} from '@avanio/logger-like';
import {clearDefaultValueSeenMap, getConfigVariable, setLogger, stringParser} from '@avanio/variable-util';
import {spy} from 'sinon';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {viteEnv} from '../src/index.js';

const logSpy = spy();

const spyLogger = {
	debug: logSpy,
	error: logSpy,
	info: logSpy,
	trace: logSpy,
	warn: logSpy,
} satisfies ILoggerLike;

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
			const call: Promise<string | undefined> = getConfigVariable('TEST', [viteEnv()], stringParser(), undefined, {showValue: true});
			await expect(call).resolves.toEqual('asd');
			expect(logSpy.getCall(0).args[0]).to.be.eq(`ConfigVariables[vite-env]: TEST [asd] from import.meta.env.VITE_TEST`);
		});
		it('should return undefined if not found', async function () {
			const call: Promise<string | undefined> = getConfigVariable('_NOT_EXISTS', [viteEnv()], stringParser(), undefined, {showValue: true});
			await expect(call).resolves.toEqual(undefined);
		});
	});
});
