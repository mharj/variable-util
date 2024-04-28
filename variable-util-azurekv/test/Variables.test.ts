import 'mocha';
import * as dotenv from 'dotenv';
import * as sinon from 'sinon';
import {getConfigVariable, setLogger, UrlParser} from '@avanio/variable-util';
import {AzureSecretsConfigLoader} from '../src/';
import {DefaultAzureCredential} from '@azure/identity';
import {expect} from 'chai';
import {ILoggerLike} from '@avanio/logger-like';
import {urlSanitize} from '@avanio/variable-util/dist/lib/formatUtils';

dotenv.config();

const debugSpy = sinon.spy();
const infoSpy = sinon.spy();
const errorSpy = sinon.spy();
const warnSpy = sinon.spy();
const traceSpy = sinon.spy();

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

setLogger({
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
});

const debugLogger: ILoggerLike = {
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
};

let mongoUrl: URL;
let mongoString: string;

describe('az key vault config variable', () => {
	before(function () {
		if (!process.env.KV_URI || !process.env.KV_MONGO_KEY || !process.env.MONGO_URL) {
			this.skip();
		}
		mongoUrl = new URL(process.env.MONGO_URL);
		mongoString = urlSanitize(mongoUrl.href);
	});
	beforeEach(() => {
		debugSpy.resetHistory();
		infoSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		traceSpy.resetHistory();
	});
	it('should return fetch value', async function () {
		this.timeout(600000);
		const urlParser = new UrlParser({urlSanitize: true});
		const fetchKvInstance = new AzureSecretsConfigLoader(async () => ({
			credentials: new DefaultAzureCredential(),
			expireMs: 100,
			logger: debugLogger,
			url: `${process.env.KV_URI}`,
		}));
		const fetchKv = fetchKvInstance.getLoader;
		const callback1 = getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		const callback2 = getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		await callback1;
		await callback2;
		expect(errorSpy.callCount, errorSpy.getCall(0)?.args[0]).to.be.eq(0);
		expect(infoSpy.getCall(0).args[0]).to.be.eq(
			`ConfigVariables[azure-secrets]: MONGO_URL [${mongoString}] from ${process.env.KV_URI}${process.env.KV_MONGO_KEY}`,
		);
		expect(infoSpy.callCount).to.be.eq(1);
		expect(debugSpy.callCount).to.be.eq(1);
		expect(debugSpy.getCall(0).args).to.be.eql(['azure-secrets', `getting ${process.env.KV_MONGO_KEY} from ${process.env.KV_URI}`]);
		expect(await callback1).to.be.eql(mongoUrl);
		// should be expired after 100ms
		await sleep(200);
		await getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		expect(debugSpy.callCount).to.be.eq(2);
		expect(debugSpy.getCall(1).args).to.be.eql(['azure-secrets', `getting ${process.env.KV_MONGO_KEY} from ${process.env.KV_URI}`]);
	});
});
