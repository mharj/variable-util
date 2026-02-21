import {describe, expect, it} from 'vitest';

describe('@avanio/variable-util-tachyon', () => {
	it('test CJS loading', () => {
		const {TachyonConfigLoader} = require('@avanio/variable-util-tachyon');
		expect(TachyonConfigLoader).toBeInstanceOf(Object);
	});
	it('test ESM loading', async () => {
		const {TachyonConfigLoader} = await import('@avanio/variable-util-tachyon');
		expect(TachyonConfigLoader).toBeInstanceOf(Object);
	});
});
