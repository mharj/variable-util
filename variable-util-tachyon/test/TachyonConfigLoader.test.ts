import {type ILoggerLike} from '@avanio/logger-like';
import {getConfigObjectResult, stringParser} from '@avanio/variable-util';
import {spy} from 'sinon';
import {type IStorageDriver, MemoryStorageDriver} from 'tachyon-drive';
import {beforeEach, describe, expect, it} from 'vitest';
import {
	tachyonConfigJsonArrayBufferSerializer,
	tachyonConfigJsonBufferSerializer,
	tachyonConfigJsonStringSerializer,
	TachyonConfigLoader,
	type TachyonConfigStoreType,
} from '../src/index';

const anyLogSpy = spy();

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
		beforeEach(async () => {
			configMemoryDriver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonStringSerializer, null);
			await configMemoryDriver.store({_v: 1, data: {TEST: 'initial'}});
			tachyonConfigLoader = new TachyonConfigLoader(configMemoryDriver, {logger: loggerSpy}, undefined, 'unit-test');
			anyLogSpy.resetHistory();
		});
		it('should not date any data', async () => {
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result.ok()).toEqual({type: 'unit-test', value: 'initial', stringValue: 'initial', namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(1);
		});
		it('should set and get data', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			await expect(tachyonConfigLoader.get('TEST')).resolves.toEqual('test');
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(2);
		});
		it('should remove value from store', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			const result1 = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result1.isOk).toBe(true);
			expect(result1.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			await tachyonConfigLoader.remove('TEST');
			const result2 = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result2.isOk).toBe(true);
			expect(result2.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(3);
		});
		it('should clear all data', async () => {
			await tachyonConfigLoader.clear();
			expect(tachyonConfigLoader.size()).toEqual(0);
			expect(anyLogSpy.callCount).toEqual(2);
		});
	});
	describe('StorageDriver - Buffer', () => {
		beforeEach(async () => {
			configMemoryDriver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonBufferSerializer, null);
			await configMemoryDriver.store({_v: 1, data: {OTHER: 'initial'}});
			tachyonConfigLoader = new TachyonConfigLoader(configMemoryDriver, {logger: loggerSpy}, undefined, 'unit-test');
			anyLogSpy.resetHistory();
		});
		it('should not date any data', async () => {
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(1);
		});
		it('should set and get data', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			await expect(tachyonConfigLoader.get('TEST')).resolves.toEqual('test');
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(2);
		});
		it('should remove value from store', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			const result1 = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result1.isOk).toBe(true);
			expect(result1.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			await tachyonConfigLoader.remove('TEST');
			const result2 = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result2.isOk).toBe(true);
			expect(result2.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(3);
		});
		it('should clear all data', async () => {
			await tachyonConfigLoader.clear();
			expect(tachyonConfigLoader.size()).toEqual(0);
			expect(anyLogSpy.callCount).toEqual(2);
		});
	});
	describe('StorageDriver - ArrayBuffer', () => {
		beforeEach(async () => {
			configMemoryDriver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonArrayBufferSerializer, null);
			await configMemoryDriver.store({_v: 1, data: {OTHER: 'initial'}});
			tachyonConfigLoader = new TachyonConfigLoader(configMemoryDriver, {logger: loggerSpy}, undefined, 'unit-test');
			anyLogSpy.resetHistory();
		});
		it('should not date any data', async () => {
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(1);
		});
		it('should set and get data', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			await expect(tachyonConfigLoader.get('TEST')).resolves.toEqual('test');
			const result = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(2);
		});
		it('should remove value from store', async () => {
			await tachyonConfigLoader.set('TEST', 'test');
			const result1 = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result1.isOk).toBe(true);
			expect(result1.ok()).toEqual({type: 'unit-test', value: 'test', stringValue: 'test', namespace: undefined});
			await tachyonConfigLoader.remove('TEST');
			const result2 = await getConfigObjectResult('TEST', [tachyonConfigLoader], stringParser());
			expect(result2.isOk).toBe(true);
			expect(result2.ok()).toEqual({type: undefined, value: undefined, stringValue: undefined, namespace: undefined});
			expect(anyLogSpy.callCount).toEqual(3);
		});
		it('should clear all data', async () => {
			await tachyonConfigLoader.clear();
			expect(tachyonConfigLoader.size()).toEqual(0);
			expect(anyLogSpy.callCount).toEqual(2);
		});
	});
});
