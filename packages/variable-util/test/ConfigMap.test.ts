import type {IResult} from '@luolapeikko/result-option';
import * as dotenv from 'dotenv';
import {URL} from 'url';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
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
import {type TestObjectType, testObjectFinalSchema, testObjectParser} from './testObjectParse';

const env = new EnvConfigLoader();

const updateSpy = vi.fn();

dotenv.config({quiet: true});

const debugSpy = vi.fn();
const infoSpy = vi.fn();
const errorSpy = vi.fn();
const warnSpy = vi.fn();
const traceSpy = vi.fn();

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
	ARRAY: z.array(z.string()),
	BIG_INT: z.bigint(),
	CONSTANT: z.literal('constant'),
	DEBUG: z.boolean(),
	DEMO: z.string().optional(),
	HOST: z.string(),
	NOT_EXISTS: z.string(),
	PORT: z.number(),
	SILENT_VALUE: z.number(),
	TEST_OBJECT: testObjectFinalSchema,
	URL: z.instanceof(URL),
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
		ARRAY: {defaultValue: ['a', 'b', 'c'], params: {showValue: true}, parser: arrayParser(stringParser())},
		BIG_INT: {defaultValue: BigInt(123456789012345), params: {showValue: true}, parser: bigIntParser()},
		CONSTANT: {defaultValue: 'constant', parser: stringParser(zodTypeGuard(z.literal('constant')))},
		DEBUG: {defaultValue: false, parser: booleanParser()},
		DEMO: {parser: stringParser()},
		HOST: {defaultValue: 'localhost', parser: stringParser()},
		NOT_EXISTS: {parser: stringParser(), undefinedErrorMessage: 'add NOT_EXISTS to env', undefinedThrowsError: true},
		PORT: {defaultValue: 3000, parser: integerParser()},
		SILENT_VALUE: {defaultValue: 3000, params: {showValue: true}, parser: integerParser()},
		TEST_OBJECT: {defaultValue: {First: false, Second: false, Third: true}, parser: testObjectParser},
		URL: {
			defaultValue: new URL('http://localhost:3000'),
			params: {showValue: true},
			parser: new UrlParser({urlSanitize: true}),
		},
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
		debugSpy.mockClear();
		infoSpy.mockClear();
		errorSpy.mockClear();
		warnSpy.mockClear();
		traceSpy.mockClear();
		updateSpy.mockClear();
	});
	describe('get', () => {
		it('should return PORT env value', async function () {
			process.env.PORT = '6000';
			const call: Promise<number> = config.get('PORT');
			await expect(call).resolves.toEqual(6000);
			expect(infoSpy.mock.calls.length).to.be.eq(1);
		});
		it('should return PORT env value', async function () {
			const call: Promise<number> = config.get('SILENT_VALUE', {silent: true});
			await expect(call).resolves.toEqual(3000);
			expect(infoSpy.mock.calls.length).to.be.eq(0);
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
			expect(infoSpy.mock.calls.length).to.be.eq(1);
		});
		it('should return DEBUG env value (already seen)', async function () {
			process.env.DEBUG = 'true';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).resolves.toEqual(true);
			expect(infoSpy.mock.calls.length).to.be.eq(0);
		});
		it('should return DEBUG env value (change)', async function () {
			process.env.DEBUG = 'false';
			const call: Promise<boolean> = config.get('DEBUG');
			await expect(call).resolves.toEqual(false);
			expect(infoSpy.mock.calls.length).to.be.eq(1);
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
			expect(infoSpy.mock.calls[0]?.[0]).to.be.eq('ConfigVariables:Demo[default]: ARRAY [a;b;c] from default');
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
			expect(updateSpy.mock.calls.length).to.be.eq(2);
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
			expect(infoSpy.mock.calls[0]?.[0]).to.be.eq('ConfigVariables:Demo[env]: URL [https://***:***@www.google.com/] from process.env.URL');
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
				ARRAY: {namespace: 'Demo', stringValue: 'a;b;c', type: 'default', value: ['a', 'b', 'c']},
				BIG_INT: {
					namespace: 'Demo',
					stringValue: '123456789012345',
					type: 'default',
					value: 123456789012345n,
				},
				CONSTANT: {namespace: 'Demo', stringValue: 'constant', type: 'env', value: 'constant'},
				DEBUG: {namespace: 'Demo', stringValue: 'true', type: 'env', value: true},
				DEMO: {namespace: 'Demo', stringValue: undefined, type: undefined, value: undefined},
				HOST: {namespace: 'Demo', stringValue: 'minecraft', type: 'env', value: 'minecraft'},
				NOT_EXISTS: {namespace: 'Demo', stringValue: 'not_exists', type: 'env', value: 'not_exists'},
				PORT: {namespace: 'Demo', stringValue: '6000', type: 'env', value: 6000},
				SILENT_VALUE: {namespace: 'Demo', stringValue: '3000', type: 'default', value: 3000},
				TEST_OBJECT: {
					namespace: 'Demo',
					stringValue: 'First=false;Second=false;Third=true',
					type: 'default',
					value: {
						First: false,
						Second: false,
						Third: true,
					},
				},
				URL: {namespace: 'Demo', stringValue: 'https://asd:qwe@www.google.com/', type: 'env', value: result.URL.value},
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
