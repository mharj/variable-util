import {describe, expect, it} from 'vitest';
import * as z from 'zod';
import {env, getConfigObject, getConfigVariable, SemicolonConfigParser} from '../src';

const booleanParamSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

type RawType = {
	test: 'true' | 'false';
	url?: string;
};

const testEnvSchema = z.object({
	test: booleanParamSchema,
	url: z
		.string()
		.url()
		.optional()
		.transform((val) => (val ? new URL(val) : undefined)),
});

type OutType = z.infer<typeof testEnvSchema>;

const parser = new SemicolonConfigParser<OutType, RawType>({
	validate: (value): Promise<OutType> => testEnvSchema.parseAsync(value),
});

describe('Semicolon config parser', function () {
	it('should parse values', async function () {
		process.env.TEST_ENV = 'test=true;demo=false';
		const conf = await getConfigVariable('TEST_ENV', [env()], parser, undefined, {showValue: true});
		expect(conf?.test).to.equal(true);
	});
	it('should parse url values', async function () {
		process.env.TEST_ENV = 'test=true;demo=false;url=https%3A%2F%2Fexample.com';
		const conf = await getConfigObject('TEST_ENV', [env()], parser, undefined, {showValue: true});
		if (!conf.value) {
			throw new Error('Config object is undefined');
		}
		expect(conf.value.url).to.eql(new URL('https://example.com'));
		expect(conf.stringValue).to.equal('test=true;url=https%3A%2F%2Fexample.com%2F');
	});
	it('should parse url values and encoder option', async function () {
		process.env.TEST_ENV = 'test=true;demo=false;url=https%3A%2F%2Fexample.com';
		const conf = await getConfigObject('TEST_ENV', [env()], parser, undefined, {showValue: true}, undefined, {uriEncode: false});
		if (!conf.value) {
			throw new Error('Config object is undefined');
		}
		expect(conf.value.url).to.eql(new URL('https://example.com'));
		expect(conf.stringValue).to.equal('test=true;url=https://example.com/');
	});
});
