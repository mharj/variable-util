import {type IResult, Ok} from '@luolapeikko/result-option';
import {describe, expect, it} from 'vitest';
import {EnvConfigLoader, getConfigVariableResult, stringParser} from '../src';

const env = new EnvConfigLoader();

describe('getConfigVariableResult', function () {
	it('should return process env value', async function () {
		process.env.TEST = 'asd';
		const call: Promise<IResult<string | undefined>> = getConfigVariableResult('TEST', [env], stringParser(), undefined, {
			showValue: true,
		});
		await expect(call).resolves.toEqual(Ok('asd'));
	});
});
