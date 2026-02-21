import {describe, expect, it} from 'vitest';

describe('@avanio/variable-util-vite', () => {
	it('test ESM loading', async () => {
		const {ViteEnvConfigLoader} = await import('@avanio/variable-util-vite');
		expect(ViteEnvConfigLoader).toBeInstanceOf(Object);
	});
});
