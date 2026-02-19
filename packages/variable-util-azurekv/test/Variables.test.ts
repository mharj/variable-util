import type {ILoggerLike} from '@avanio/logger-like';
import {getConfigVariable, setLogger, UrlParser} from '@avanio/variable-util';
import type {SecretClient} from '@azure/keyvault-secrets';
import * as dotenv from 'dotenv';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {AzureSecretsConfigLoader} from '../src';
import {SecretClientMockup} from './lib/SecretClientMockup';

dotenv.config({quiet: true});

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const debugLogger = {
	debug: vi.fn(),
	error: vi.fn(),
	info: vi.fn(),
	trace: vi.fn(),
	warn: vi.fn(),
} satisfies ILoggerLike;

setLogger(debugLogger);

const secretClientMockup = new SecretClientMockup() as unknown as SecretClient;

const mongoUrlString = new URL('mongodb://localhost:27017/test');

describe('az key vault config variable', () => {
	beforeAll(function () {
		secretClientMockup.setSecret('kv-mongo-url', mongoUrlString.toString());
	});
	beforeEach(() => {
		for (const logger of Object.values(debugLogger)) {
			logger.mockClear();
		}
	});
	it('should return value', async function () {
		const urlParser = new UrlParser({urlSanitize: true});
		const fetchKv = new AzureSecretsConfigLoader<{MONGO_URL: string}>(
			() => ({
				expireMs: 100,
				isSilent: false,
				logger: debugLogger,
				secretClient: secretClientMockup,
			}),
			{
				MONGO_URL: 'kv-mongo-url',
			},
		);
		const callback1 = getConfigVariable('MONGO_URL', [fetchKv], urlParser, undefined, {showValue: true});
		const callback2 = getConfigVariable('MONGO_URL', [fetchKv], urlParser, undefined, {showValue: true});
		await callback1;
		await callback2;
		expect(debugLogger.error.mock.calls.length).to.be.eq(0);
		expect(debugLogger.info.mock.calls.length).to.be.eq(1);
		expect(debugLogger.info.mock.calls[0][0]).to.be.eq(`ConfigVariables[azure-secrets]: MONGO_URL [${mongoUrlString}] from http://localhost/kv-mongo-url`);
		expect(debugLogger.debug.mock.calls.length).to.be.eq(1);
		expect(debugLogger.debug.mock.calls[0]).to.be.eql(['azure-secrets', `getting kv-mongo-url from http://localhost`]);
		expect(await callback1).to.be.eql(mongoUrlString);
		// should be expired after 100ms
		await sleep(200);
		await getConfigVariable('MONGO_URL', [fetchKv], urlParser, undefined, {showValue: true});
		expect(debugLogger.debug.mock.calls.length).to.be.eq(2);
		expect(debugLogger.debug.mock.calls[1]).to.be.eql(['azure-secrets', `getting kv-mongo-url from http://localhost`]);
	});
});
