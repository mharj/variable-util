import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as z from 'zod';
import {env, getConfigVariable, SemicolonConfigParser} from '../src/';

chai.use(chaiAsPromised);
const expect = chai.expect;
const booleanParamSchema = z.enum(['true', 'false']).transform((value) => value === 'true');

type RawType = {
	test: 'true' | 'false';
};

const testEnvSchema = z.object({
	test: booleanParamSchema,
});

type OutType = z.infer<typeof testEnvSchema>;

const parser = new SemicolonConfigParser<OutType, RawType>({
	validate: (value): Promise<OutType> => testEnvSchema.parseAsync(value),
});

describe('Test', function () {
	it('should', async function () {
		process.env.TEST_ENV = 'test=true;demo=false';
		const conf = await getConfigVariable('TEST_ENV', [env()], parser, undefined, {showValue: true});
		expect(conf?.test).to.equal(true);
	});
});
