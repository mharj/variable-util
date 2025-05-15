import {URL} from 'url';
import {type IResult} from '@luolapeikko/result-option';
import * as dotenv from 'dotenv';
import {spy} from 'sinon';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {z} from 'zod';
import {
	arrayParser,
	bigIntParser,
	booleanParser,
	ConfigMap,
	EnvConfigLoader,
	integerParser,
	MemoryConfigLoader,
	setLogger,
	stringParser,
	UrlParser,
	VariableError,
} from '../src';
import {testObjectFinalSchema, testObjectParser, type TestObjectType} from './testObjectParse';

const env = new EnvConfigLoader();

const updateSpy = spy();

dotenv.config();

const debugSpy = spy();
const infoSpy = spy();
const errorSpy = spy();
const warnSpy = spy();
const traceSpy = spy();

export const spyLogger = {
	debug: debugSpy,
	error: errorSpy,
	info: infoSpy,
	trace: traceSpy,
	warn: warnSpy,
};

type TestEnv = {
	PORT: number;
	DEMO?: string;
	HOST: string;
	DEBUG: boolean;
	URL: URL;
	CONSTANT: 'constant';
	TEST_OBJECT: TestObjectType;
	NOT_EXISTS: string;
	ARRAY: string[];
	SILENT_VALUE: number;
	BIG_INT: bigint;
};

const testEnvSchema = z.object({
	DEBUG: z.boolean(),
	DEMO: z.string().optional(),
	HOST: z.string(),
	PORT: z.number(),
	URL: z.instanceof(URL),
	CONSTANT: z.literal('constant'),
	TEST_OBJECT: testObjectFinalSchema,
	NOT_EXISTS: z.string(),
	ARRAY: z.array(z.string()),
	SILENT_VALUE: z.number(),
	BIG_INT: z.bigint(),
});

const memoryEnv = new MemoryConfigLoader<{PORT?: string}>(
	{
		PORT: undefined,
	},
	{logger: spyLogger},
);
memoryEnv.on('updated', updateSpy);

const loaders = [memoryEnv, env];

function zodTypeGuard<T>(schema: z.ZodType<T>) {
	return (value: unknown): value is T => {
		const result = schema.safeParse(value);
		if (!result.success) {
			throw new Error(result.error.message);
		}
		return true;
	};
}

const config = new ConfigMap<TestEnv>(
	{
		DEBUG: {parser: booleanParser(), defaultValue: false},
		DEMO: {parser: stringParser()},
		HOST: {parser: stringParser(), defaultValue: 'localhost'},
		PORT: {parser: integerParser(), defaultValue: 3000},
		URL: {
			parser: new UrlParser({urlSanitize: true}),
			defaultValue: new URL('http://localhost:3000'),
			params: {showValue: true},
		},
		CONSTANT: {parser: stringParser(zodTypeGuard(z.literal('constant'))), defaultValue: 'constant'},
		TEST_OBJECT: {parser: testObjectParser, defaultValue: {First: false, Second: false, Third: true}},
		NOT_EXISTS: {parser: stringParser(), undefinedThrowsError: true, undefinedErrorMessage: 'add NOT_EXISTS to env'},
		ARRAY: {parser: arrayParser(stringParser()), defaultValue: ['a', 'b', 'c'], params: {showValue: true}},
		SILENT_VALUE: {parser: integerParser(), defaultValue: 3000, params: {showValue: true}},
		BIG_INT: {parser: bigIntParser(), defaultValue: BigInt(123456789012345), params: {showValue: true}},
	},
	() => Promise.resolve(loaders),
	{namespace: 'Demo'},
);
config.setLogger(spyLogger);

describe('ConfigMap', () => {
	beforeAll(() => {
		setLogger(spyLogger);
	});
	beforeEach(() => {
		debugSpy.resetHistory();
		infoSpy.resetHistory();
		errorSpy.resetHistory();
		warnSpy.resetHistory();
		traceSpy.resetHistory();
		updateSpy.resetHistory();
	});
	describe('get', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Promise<number> = config.get('PORT');
			await expect(call).resolves.toEqual(6000);
			expect(infoSpy.callCount).to.be.eq(1);
		});
		it('should return PORT env value', async function () {
			const call: Promise<number> = config.get('SILENT_VALUE', {silent: true});
			await expect(call).resolves.toEqual(3000);
			expect(infoSpy.callCount).to.be.eq(0);
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: Promise<string> = config.get('HOST');
			await expect(call).resolves.toEqual('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).resolves.toEqual(true);
			expect(infoSpy.callCount).to.be.eq(1);
		});
		it('should return DEBUG env value (already seen)', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).resolves.toEqual(true);
			expect(infoSpy.callCount).to.be.eq(0);
		});
		it('should return DEBUG env value (change)', async function () {
			process.env.DEBUG = 'false';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).resolves.toEqual(false);
			expect(infoSpy.callCount).to.be.eq(1);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com';
			const call: Promise<URL> = config.get('URL');
			await expect(call).resolves.toEqual(new URL('https://www.google.com'));
		});
		it('should return CONSTANT env value', async function () {
			process.env.CONSTANT = 'constant';
			const call: Promise<'constant'> = config.get('CONSTANT');
			await expect(call).resolves.toEqual('constant');
		});
		it('should return CONSTANT env value', async function () {
			const call: Promise<string> = config.get('NOT_EXISTS');
			// vitest promise rejection
			await expect(call).rejects.toEqual(new VariableError('add NOT_EXISTS to env'));
		});
		it('should return CONSTANT env value', async function () {
			const call: Promise<string[]> = config.get('ARRAY');
			await expect(call).resolves.toEqual(['a', 'b', 'c']);
			expect(infoSpy.args[0]?.[0]).to.be.eq('ConfigVariables:Demo[default]: ARRAY [a;b;c] from default');
		});
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			await expect(config.get('PORT')).resolves.toEqual(6000);
			await memoryEnv.set('PORT', '7000');
			await expect(config.get('PORT')).resolves.toEqual(7000);
			await memoryEnv.setDisabled(() => Promise.resolve(true));
			await expect(config.get('PORT')).resolves.toEqual(6000);
			await memoryEnv.set('PORT', undefined);
			await expect(config.get('PORT')).resolves.toEqual(6000);
			process.env.PORT = undefined;
			expect(updateSpy.callCount).to.be.eq(2);
		});
	});
	describe('getString', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Promise<string> = config.getString('PORT');
			await expect(call).resolves.toEqual('6000');
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: Promise<string> = config.getString('HOST');
			await expect(call).resolves.toEqual('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<string> = config.getString('DEBUG');
			await expect(call).resolves.toEqual('true');
		});
		it('should return DEMO env value', async function () {
			const call: Promise<string | undefined> = config.getString('DEMO');
			await expect(call).resolves.toEqual(undefined);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com/';
			const call: Promise<string> = config.getString('URL');
			await expect(call).resolves.toEqual('https://www.google.com/');
		});
	});
	describe('getStringIResult', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: IResult<string> = await config.getStringResult('PORT');
			expect(call.ok()).to.be.eq('6000');
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: IResult<string> = await config.getStringResult('HOST');
			expect(call.ok()).to.be.eq('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: IResult<string | undefined> = await config.getStringResult('DEBUG');
			expect(call.ok()).to.be.eq('true');
		});
		it('should return DEMO env value', async function () {
			const call: IResult<string | undefined> = await config.getStringResult('DEMO');
			expect(call.ok()).to.be.eq(undefined);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://www.google.com/';
			const call: IResult<string | undefined> = await config.getStringResult('URL');
			expect(call.ok()).to.be.eq('https://www.google.com/');
		});
	});
	describe('getIResult', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: IResult<number> = await config.getResult('PORT');
			expect(call.ok()).to.be.eq(6000);
		});
		it('should return HOST env value', async function () {
			process.env.HOST = 'minecraft';
			const call: IResult<string> = await config.getResult('HOST');
			expect(call.ok()).to.be.eq('minecraft');
		});
		it('should return DEBUG env value', async function () {
			process.env.DEBUG = 'true';
			const call: IResult<boolean> = await config.getResult('DEBUG');
			expect(call.ok()).to.be.eq(true);
		});
		it('should return URL env value', async function () {
			process.env.URL = 'https://asd:qwe@www.google.com';
			const call: IResult<URL> = await config.getResult('URL');
			expect(call.ok()?.href).to.be.eql(new URL('https://asd:qwe@www.google.com').href);
			expect(infoSpy.args[0]?.[0]).to.be.eq('ConfigVariables:Demo[env]: URL [https://***:***@www.google.com/] from process.env.URL');
		});
	});
	describe('getObjectResult', () => {
		it('should not return value if non-existing key', async function () {
			const call: IResult<any> = await config.getObjectResult('ASD' as any);
			expect(call.ok()).to.be.eql(undefined);
		});
		it('should not return value not valid key', async function () {
			const call: IResult<any> = await config.getObjectResult(null as any);
			expect(call.ok()).to.be.eql(undefined);
		});
	});
	describe('getAll', () => {
		it('should get all values', async function () {
			process.env.NOT_EXISTS = 'not_exists'; // else it will throw error
			const call = config.getAllObjects();
			const result = await call;
			await expect(call).resolves.toEqual({
				DEBUG: {type: 'env', value: true, stringValue: 'true', namespace: 'Demo'},
				DEMO: {type: undefined, value: undefined, stringValue: undefined, namespace: 'Demo'},
				HOST: {type: 'env', value: 'minecraft', stringValue: 'minecraft', namespace: 'Demo'},
				NOT_EXISTS: {type: 'env', value: 'not_exists', stringValue: 'not_exists', namespace: 'Demo'},
				PORT: {type: 'env', value: 6000, stringValue: '6000', namespace: 'Demo'},
				URL: {type: 'env', value: result.URL.value, stringValue: 'https://asd:qwe@www.google.com/', namespace: 'Demo'},
				CONSTANT: {type: 'env', value: 'constant', stringValue: 'constant', namespace: 'Demo'},
				TEST_OBJECT: {
					stringValue: 'First=false;Second=false;Third=true',
					type: 'default',
					value: {
						First: false,
						Second: false,
						Third: true,
					},
					namespace: 'Demo',
				},
				ARRAY: {type: 'default', value: ['a', 'b', 'c'], stringValue: 'a;b;c', namespace: 'Demo'},
				SILENT_VALUE: {type: 'default', value: 3000, stringValue: '3000', namespace: 'Demo'},
				BIG_INT: {
					namespace: 'Demo',
					stringValue: '123456789012345',
					type: 'default',
					value: 123456789012345n,
				},
			});
		});
	});
	describe('validateAll', () => {
		it('should validate all with zod', async function () {
			process.env.NOT_EXISTS = 'not_exists'; // else it will throw error
			await config.validateAll((data) => testEnvSchema.parse(data));
		});
	});
	describe('validate', () => {
		it('should validate all with zod', async function () {
			expect(await config.getString('TEST_OBJECT')).to.be.eq('First=false;Second=false;Third=true');
		});
	});
});
