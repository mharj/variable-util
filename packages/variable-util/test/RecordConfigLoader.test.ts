import {type IResult, Ok} from '@luolapeikko/result-option';
import {describe, expect, it} from 'vitest';
import {getConfigObjectResult, type IConfigLoaderProps, type LoaderTypeValue, type LoaderValue, RecordConfigLoader, stringParser} from '../src';

class TestRecordConfigLoader extends RecordConfigLoader<IConfigLoaderProps> {
	public readonly loaderType = 'test';

	protected defaultOptions = {};

	public async setValue(key: string, value: string) {
		const data = await this.getData();
		data[key] = value;
	}
	protected handleData(): Promise<Record<string, string>> {
		return this.dataPromise ?? Promise.resolve({});
	}

	protected async handleLoaderValue(lookupKey: string): Promise<undefined | LoaderValue> {
		const data = await this.getData();
		return {path: `test.${lookupKey}`, value: data?.[lookupKey]};
	}

	private async getData() {
		if (!this._isLoaded) {
			await this.loadData();
			this._isLoaded = true; // only load data once
		}
		if (!this.dataPromise) {
			this.dataPromise = Promise.resolve({});
		}
		return this.dataPromise;
	}
}

const testLoader = new TestRecordConfigLoader();

describe('RecordConfigLoader', function () {
	it('should return process env value', function () {
		expect(testLoader.isLoaded()).toBe(false);
	});
	it('should return process env value', async function () {
		testLoader.setValue('TEST', 'asd');
		const call: Promise<IResult<LoaderTypeValue<string>>> = getConfigObjectResult('TEST', [testLoader], stringParser(), undefined, {
			showValue: true,
		});
		await expect(call).resolves.toEqual(Ok({namespace: undefined, stringValue: 'asd', type: 'test', value: 'asd'}));
	});
	it('should return process env value', async function () {
		testLoader.reload();
		const call: Promise<IResult<LoaderTypeValue<string>>> = getConfigObjectResult('TEST', [testLoader], stringParser(), undefined, {
			showValue: true,
		});
		await expect(call).resolves.toEqual(Ok({namespace: undefined, stringValue: 'asd', type: 'test', value: 'asd'}));
	});
});
