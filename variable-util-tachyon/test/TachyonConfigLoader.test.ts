import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {getConfigObjectResult, stringParser} from '@avanio/variable-util';
import {type IStorageDriver, MemoryStorageDriver} from 'tachyon-drive';
import {tachyonConfigJsonBufferSerializer, tachyonConfigJsonStringSerializer, TachyonConfigLoader, type TachyonConfigStoreType} from '../src/index';
import {type ILoggerLike} from '@avanio/logger-like';
import sinon from 'sinon';

const anyLogSpy = sinon.spy();

const loggerSpy: ILoggerLike = {
	debug: anyLogSpy,
	error: anyLogSpy,
	info: anyLogSpy,
	warn: anyLogSpy,
};

let configMemoryDriver: IStorageDriver<TachyonConfigStoreType>;
let tachyonConfigLoader: TachyonConfigLoader;

describe('StorageDriver', () => {
	describe('StorageDriver - string', () => {
		beforeEach(() => {
			configMemoryDriver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonStringSerializer, null);
			tachyonConfigLoader = new TachyonConfigLoader(configMemoryDriver, {logger: loggerSpy}, 'unit-test');
			anyLogSpy.resetHistory();
		});
		it('should not date any data', async () => {
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(0);
		});
		it('should set and get data', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			await expect(tachyonConfigLoader.get('TEST')).resolves.toEqual('test');
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(1);
		});
		it('should remove value from store', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			const result1 = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result1.isOk).toBe(true);
			expect(result1.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			await tachyonConfigLoader.remove('TEST');
			const result2 = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result2.isOk).toBe(true);
			expect(result2.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(2);
		});
		afterEach(async () => {
			await tachyonConfigLoader.clear();
		});
	});
	describe('StorageDriver - buffer', () => {
		beforeEach(() => {
			configMemoryDriver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonBufferSerializer, null);
			tachyonConfigLoader = new TachyonConfigLoader(configMemoryDriver, {logger: loggerSpy}, 'unit-test');
			anyLogSpy.resetHistory();
		});
		it('should not date any data', async () => {
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(0);
		});
		it('should set and get data', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			await expect(tachyonConfigLoader.get('TEST')).resolves.toEqual('test');
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(1);
		});
		it('should remove value from store', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			const result1 = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result1.isOk).toBe(true);
			expect(result1.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			await tachyonConfigLoader.remove('TEST');
			const result2 = await getConfigObjectResult('TEST', [tachyonConfigLoader.getLoader()], stringParser());
			expect(result2.isOk).toBe(true);
			expect(result2.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(2);
		});
		afterEach(async () => {
			await tachyonConfigLoader.clear();
		});
	});
});
