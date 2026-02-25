import {type IResult, Ok} from '@luolapeikko/result-option';
import {describe, expect, it} from 'vitest';
import {EnvConfigLoader, getConfigObjectResult, type LoaderTypeValue, stringParser} from '../src';

const env = new EnvConfigLoader();

describe('getConfigObjectResult', function () {
	it('should return process env value', async function () {
		process.env.TEST = 'asd';
		const call: Promise<IResult<LoaderTypeValue<string>>> = getConfigObjectResult('TEST', [env], stringParser(), undefined, {
			showValue: true,
		});
		await expect(call).resolves.toEqual(Ok({namespace: undefined, stringValue: 'asd', type: 'env', value: 'asd'}));
	});
});
