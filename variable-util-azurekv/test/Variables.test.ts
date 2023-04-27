import 'mocha';
import * as dotenv from 'dotenv';
import * as sinon from 'sinon';
import {getConfigVariable, setLogger, UrlParser} from '@avanio/variable-util';
import {AzureSecretsConfigLoader} from '../src/';
import {DefaultAzureCredential} from '@azure/identity';
import {expect} from 'chai';
import {urlSanitize} from '@avanio/variable-util/dist/lib/formatUtils';

dotenv.config();

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

let mongoUrl: URL;
let mongoString: string;

describe('key vault config variable', () => {
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
		const fetchKv = new AzureSecretsConfigLoader({credentials: async () => new DefaultAzureCredential(), url: async () => `${process.env.KV_URI}`}).getLoader;
		const callback = getConfigVariable('MONGO_URL', [fetchKv(process.env.KV_MONGO_KEY)], urlParser, undefined, {showValue: true});
		await callback;
		expect(errorSpy.callCount, errorSpy.getCall(0)?.args[0]).to.be.eq(0);
		expect(infoSpy.getCall(0).args[0]).to.be.eq(
			`ConfigVariables[azure-secrets]: MONGO_URL [${mongoString}] from ${process.env.KV_URI}${process.env.KV_MONGO_KEY}`,
		);
		expect(await callback).to.be.eql(mongoUrl);
	});
});
