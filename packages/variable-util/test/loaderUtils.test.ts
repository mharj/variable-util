import {beforeEach, describe, expect, it, vi} from 'vitest';
import {VariableError} from '../src';
import type {SolvedConfigOptions} from '../src/ConfigOptions';
import type {IConfigLoader, IConfigParser} from '../src/interfaces';
import {handleAsVariableError, handleLoader, printLog, rebuildAsVariableError} from '../src/loaderUtils';

describe('Loader utils', function () {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('printLog', function () {
		it('should log with namespace', function () {
			const logger = {error: vi.fn(), info: vi.fn()};
			const options = {logger, namespace: 'test'} as unknown as SolvedConfigOptions;
			printLog(options, 'TYPE', 'key', 'value', 'path');
			expect(logger.info).toHaveBeenCalledWith('ConfigVariables:test[TYPE]: key from path');
		});
		it('should log without namespace', function () {
			const logger = {error: vi.fn(), info: vi.fn()};
			const options = {logger} as unknown as SolvedConfigOptions;
			printLog(options, 'TYPE', 'key', 'value', 'path');
			expect(logger.info).toHaveBeenCalledWith('ConfigVariables[TYPE]: key from path');
		});
		it('should log with format parameters', function () {
			const logger = {error: vi.fn(), info: vi.fn()};
			const options = {logger} as unknown as SolvedConfigOptions;
			printLog(options, 'TYPE', 'key', 'value', 'path', {showValue: true});
			expect(logger.info).toHaveBeenCalledWith('ConfigVariables[TYPE]: key [value] from path');
		});
	});

	describe('handleAsVariableError', function () {
		it('should handle VariableError', function () {
			const err = new VariableError('test');
			expect(handleAsVariableError(err)).to.eql(err);
		});
		it('should handle Error', function () {
			const err = new Error('test');
			const result = handleAsVariableError(err);
			expect(result).to.be.instanceOf(VariableError);
			expect(result.message).to.eql('test');
		});
		it('should handle unknown error', function () {
			const err = 'test';
			expect(handleAsVariableError(err)).to.eql(new VariableError('Unknown error "test"'));
		});
	});

	describe('rebuildAsVariableError', function () {
		const loader = {loaderType: 'testLoader'} as IConfigLoader;
		const parser = {name: 'testParser'} as IConfigParser<unknown, unknown>;

		it('should return same error if it is VariableError', function () {
			const err = new VariableError('test');
			expect(rebuildAsVariableError('val', err, loader, parser)).to.eql(err);
		});

		it('should wrap Error in VariableError', function () {
			const err = new Error('sub error');
			const result = rebuildAsVariableError('val', err, loader, parser);
			expect(result).to.be.instanceOf(VariableError);
			expect(result.message).to.contain('variables[testLoader](testParser): sub error');
		});

		it('should wrap Error in VariableError with params', function () {
			const err = new Error('sub error');
			const result = rebuildAsVariableError('val', err, loader, parser, {showValue: true});
			expect(result.message).to.contain('variables[testLoader](testParser): [val] sub error');
		});
	});

	describe('handleLoader', function () {
		const options = {logger: {error: vi.fn(), info: vi.fn()}} as unknown as SolvedConfigOptions;
		const loader = {
			getLoaderResult: vi.fn(),
			isLoaderDisabled: vi.fn().mockResolvedValue(false),
			loaderType: 'testloader',
		} as const satisfies IConfigLoader;
		const parser = {
			name: 'testparser',
			parse: vi.fn(),
			postValidate: vi.fn(),
			preValidate: vi.fn(),
			toLogString: vi.fn().mockReturnValue('logVal'),
			toString: vi.fn().mockReturnValue('stringVal'),
		} as const satisfies IConfigParser<any, any>;

		it('should return undefined if loader is disabled', async function () {
			vi.mocked(loader.isLoaderDisabled).mockResolvedValueOnce(true);
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
		});

		it('should return undefined if no result from loader', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce(undefined);
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
		});

		it('should handle successful load and parse', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.parse).mockResolvedValueOnce('parsed');
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.eql({
				namespace: undefined,
				stringValue: 'stringVal',
				type: 'testloader',
				value: 'parsed',
			});
			expect(options.logger?.info).toHaveBeenCalled();
		});

		it('should handle successful load and parse with seen=true', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: true, value: 'raw'});
			vi.mocked(parser.parse).mockResolvedValueOnce('parsed');
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.eql({
				namespace: undefined,
				stringValue: 'stringVal',
				type: 'testloader',
				value: 'parsed',
			});
			// Should NOT log if seen is true
			expect(options.logger?.info).not.toHaveBeenCalled();
		});

		it('should handle preValidate error', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.preValidate).mockRejectedValueOnce(new Error('pre error'));
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
			if (options.logger) {
				expect(options.logger.error).toHaveBeenCalledWith(expect.any(VariableError));
			}
		});

		it('should handle parse error', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.parse).mockRejectedValueOnce(new Error('parse error'));
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
			if (options.logger) {
				expect(options.logger.error).toHaveBeenCalledWith(expect.any(VariableError));
			}
		});

		it('should handle postValidate error', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.parse).mockResolvedValueOnce('parsed');
			vi.mocked(parser.postValidate).mockRejectedValueOnce(new Error('post error'));
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
			if (options.logger) {
				expect(options.logger.error).toHaveBeenCalledWith(expect.any(VariableError));
			}
		});

		it('should handle postValidate returning a value', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.parse).mockResolvedValueOnce('parsed');
			vi.mocked(parser.postValidate).mockResolvedValueOnce('validated');
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result?.value).to.eql('validated');
		});

		it('should handle unknown preValidate error objects', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.preValidate).mockRejectedValueOnce('pre error');
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
			if (options.logger) {
				expect(options.logger.error).toHaveBeenCalled();
			}
		});

		it('should handle unknown postValidate error objects', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.parse).mockResolvedValueOnce('parsed');
			vi.mocked(parser.postValidate).mockRejectedValueOnce('post error');
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
			if (options.logger) {
				expect(options.logger.error).toHaveBeenCalled();
			}
		});

		it('should handle unknown error objects in catch blocks', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parser.parse).mockRejectedValueOnce('string error');
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
			if (options.logger) {
				expect(options.logger.error).toHaveBeenCalled();
			}
		});

		it('should return undefined if value is falsy in result', async function () {
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: ''});
			const result = await handleLoader('key', loader, parser, undefined, options, undefined);
			expect(result).to.be.undefined;
		});

		it('should use stringValue if toLogString is missing', async function () {
			const parserWithoutLog = {...parser, toLogString: undefined} as unknown as IConfigParser<any, any>;
			vi.mocked(loader.getLoaderResult).mockResolvedValueOnce({path: 'path', seen: false, value: 'raw'});
			vi.mocked(parserWithoutLog.parse).mockResolvedValueOnce('parsed');
			vi.mocked(parserWithoutLog.toString).mockReturnValueOnce('stringVal');
			await handleLoader('key', loader, parserWithoutLog, {showValue: true}, options, undefined);
			expect(options.logger?.info).toHaveBeenCalledWith(expect.stringContaining('stringVal'));
		});
	});
});
