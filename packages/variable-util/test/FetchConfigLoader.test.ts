import {describe, expect, it, vi} from 'vitest';
import {z} from 'zod';
import {ConfigMap, createRequestNotReady, type EnvMapSchema, FetchConfigLoader, UrlParser, VariableError} from '../src';
import type {IRequestCache} from '../src/interfaces/IRequestCache';

const fetchResponsePayload = {
	API_SERVER: 'http://localhost:123/api',
} as const;

type EnvMap = {
	API_SERVER: URL;
};

const schema: EnvMapSchema<EnvMap> = {
	API_SERVER: {parser: new UrlParser(), undefinedThrowsError: true},
};

const validateFn = (data: unknown) => z.record(z.string().min(1), z.string().optional()).parseAsync(data);

const validJsonFetch = () =>
	Promise.resolve(
		new Response(JSON.stringify(fetchResponsePayload), {
			headers: {'Content-Type': 'application/json'},
			status: 200,
		}),
	);

const textFetch = () =>
	Promise.resolve(
		new Response('some text', {
			headers: {'Content-Type': 'text/plain'},
			status: 200,
		}),
	);

const errorFetch = (status = 500) =>
	Promise.resolve(
		new Response('error', {
			headers: {'Content-Type': 'text/plain'},
			status,
		}),
	);

const invalidJsonFetch = () =>
	Promise.resolve(
		new Response('invalid json', {
			headers: {'Content-Type': 'application/json'},
			status: 200,
		}),
	);

const nonObjectJsonFetch = () =>
	Promise.resolve(
		new Response('"just a string"', {
			headers: {'Content-Type': 'application/json'},
			status: 200,
		}),
	);

describe('FetchConfigLoader', function () {
	it('should return API_SERVER', async function () {
		const env = new ConfigMap<EnvMap>(schema, [
			new FetchConfigLoader(new Request('http://localhost/config.json'), {
				fetchClient: validJsonFetch,
				validate: validateFn,
			}),
		]);
		await expect(env.get('API_SERVER')).resolves.toEqual(new URL(fetchResponsePayload.API_SERVER));
	});

	it('should throw VariableError on HTTP error', async function () {
		const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
			fetchClient: () => errorFetch(404),
		});
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow(VariableError);
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow('http error 404');
	});

	it('should return undefined value on HTTP error in silent mode', async function () {
		const logger = {debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn()};
		const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
			fetchClient: () => errorFetch(404),
			isSilent: true,
			logger,
		});
		const result = await loader.getLoaderResult('API_SERVER');
		expect(result?.value).toBeUndefined();
		expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('http error 404'));
	});

	it('should throw VariableError on unsupported content-type', async function () {
		const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
			fetchClient: textFetch,
		});
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow(VariableError);
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow('unsupported content-type text/plain');
	});

	it('should throw VariableError on invalid JSON', async function () {
		const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
			fetchClient: invalidJsonFetch,
		});
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow(VariableError);
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow('FetchEnvConfig JSON error');
	});

	it('should throw VariableError when JSON is not an object', async function () {
		const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
			fetchClient: nonObjectJsonFetch,
		});
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow(VariableError);
		await expect(loader.getLoaderResult('API_SERVER')).rejects.toThrow('is not valid JSON object');
	});

	it('should handle RequestNotReady', async function () {
		const loader = new FetchConfigLoader(() => createRequestNotReady('not ready'), {
			fetchClient: validJsonFetch,
			logger: {debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn()},
		});
		const result = await loader.getLoaderResult('API_SERVER');
		expect(result?.value).toBeUndefined();
	});

	describe('Cache tests', function () {
		const mockCache = (): IRequestCache => ({
			fetchRequest: vi.fn(),
			isOnline: vi.fn().mockReturnValue(true),
			storeRequest: vi.fn(),
		});

		it('should use cache when offline', async function () {
			const cache = mockCache();
			vi.mocked(cache.isOnline).mockReturnValue(false);
			vi.mocked(cache.fetchRequest).mockResolvedValue(
				new Response(JSON.stringify(fetchResponsePayload), {
					headers: {'Content-Type': 'application/json'},
					status: 200,
				}),
			);

			const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
				cache,
				fetchClient: vi.fn(), // Should not be called
			});
			const result = await loader.getLoaderResult('API_SERVER');
			expect(result?.value).toBe(fetchResponsePayload.API_SERVER);
			expect(cache.fetchRequest).toHaveBeenCalled();
		});

		it('should return undefined value when offline and no cache', async function () {
			const cache = mockCache();
			vi.mocked(cache.isOnline).mockReturnValue(false);
			vi.mocked(cache.fetchRequest).mockResolvedValue(undefined);

			const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
				cache,
				fetchClient: vi.fn(),
			});
			const result = await loader.getLoaderResult('API_SERVER');
			expect(result?.value).toBeUndefined();
		});

		it('should store successful response in cache', async function () {
			const cache = mockCache();
			const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
				cache,
				fetchClient: validJsonFetch,
			});
			await loader.getLoaderResult('API_SERVER');
			expect(cache.storeRequest).toHaveBeenCalled();
		});

		it('should handle 304 Not Modified', async function () {
			const cache = mockCache();
			vi.mocked(cache.fetchRequest).mockResolvedValue(
				new Response(JSON.stringify(fetchResponsePayload), {
					headers: {'Content-Type': 'application/json'},
					status: 200,
				}),
			);

			const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
				cache,
				fetchClient: () => Promise.resolve(new Response(null, {status: 304})),
			});
			const result = await loader.getLoaderResult('API_SERVER');
			expect(result?.value).toEqual(fetchResponsePayload.API_SERVER);
		});

		it('should use ETag for cache validation', async function () {
			const cache = mockCache();
			vi.mocked(cache.fetchRequest).mockResolvedValue(
				new Response('{}', {
					headers: {'Content-Type': 'application/json', etag: 'v1'},
					status: 200,
				}),
			);

			const fetchClient = vi.fn().mockResolvedValue(new Response(null, {status: 304}));

			const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
				cache,
				fetchClient,
			});
			await loader.getLoaderResult('API_SERVER');

			// Check if If-None-Match header was added
			const lastCall = fetchClient.mock.calls[0][0] as Request;
			expect(lastCall.headers.get('If-None-Match')).toBe('v1');
		});

		it('should use cached response on HTTP error from server', async function () {
			const cache = mockCache();
			vi.mocked(cache.fetchRequest).mockResolvedValue(
				new Response(JSON.stringify(fetchResponsePayload), {
					headers: {'Content-Type': 'application/json'},
					status: 200,
				}),
			);

			const loader = new FetchConfigLoader(new Request('http://localhost/config.json'), {
				cache,
				fetchClient: () => errorFetch(500),
			});
			const result = await loader.getLoaderResult('API_SERVER');
			expect(result?.value).toEqual(fetchResponsePayload.API_SERVER);
		});
	});
});
