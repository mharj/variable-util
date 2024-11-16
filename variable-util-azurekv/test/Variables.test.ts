/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import * as dotenv from 'dotenv';
import * as sinon from 'sinon';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {getConfigVariable, setLogger, UrlParser, urlSanitize} from '@avanio/variable-util';
import {AzureSecretsConfigLoader} from '../src/';
import {DefaultAzureCredential} from '@azure/identity';
import {type ILoggerLike} from '@avanio/logger-like';

dotenv.config();

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const debugLogger = {
	debug: sinon.spy(),
	error: sinon.spy(),
	info: sinon.spy(),
	trace: sinon.spy(),
	warn: sinon.spy(),
} satisfies ILoggerLike;

setLogger(debugLogger);

let mongoUrl: URL;
let mongoString: string;

describe('az key vault config variable', {skip: !process.env.KV_URI || !process.env.KV_MONGO_KEY || !process.env.MONGO_URL}, () => {
	beforeAll(function () {
		if (!process.env.KV_URI || !process.env.KV_MONGO_KEY || !process.env.MONGO_URL) {
			return;
		}
		mongoUrl = new URL(process.env.MONGO_URL);
		mongoString = urlSanitize(mongoUrl.href);
	});
	beforeEach(() => {
		for (const logger of Object.values(debugLogger)) {
			logger.resetHistory();
		}
	});
	it('should return fetch value', async function () {
		const urlParser = new UrlParser({urlSanitize: true});
		const fetchKvInstance = new AzureSecretsConfigLoader(() => ({
			credentials: new DefaultAzureCredential(),
			expireMs: 100,
			isSilent: false,
			logger: debugLogger,
			url: `${process.env.KV_URI}`,
		}));
		const fetchKv = fetchKvInstance.getLoader;
		const callback1 = getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		const callback2 = getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		await callback1;
		await callback2;
		expect(debugLogger.error.callCount, debugLogger.error.getCall(0)?.args[0]).to.be.eq(0);
		expect(debugLogger.info.getCall(0).args[0]).to.be.eq(
			`ConfigVariables[azure-secrets]: MONGO_URL [${mongoString}] from ${process.env.KV_URI}${process.env.KV_MONGO_KEY}`,
		);
		expect(debugLogger.info.callCount).to.be.eq(1);
		expect(debugLogger.debug.callCount).to.be.eq(1);
		expect(debugLogger.debug.getCall(0).args).to.be.eql(['azure-secrets', `getting ${process.env.KV_MONGO_KEY} from ${process.env.KV_URI}`]);
		expect(await callback1).to.be.eql(mongoUrl);
		// should be expired after 100ms
		await sleep(200);
		await getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		expect(debugLogger.debug.callCount).to.be.eq(2);
		expect(debugLogger.debug.getCall(1).args).to.be.eql(['azure-secrets', `getting ${process.env.KV_MONGO_KEY} from ${process.env.KV_URI}`]);
	});
});
