import {describe, expect, it} from 'vitest';

describe('@avanio/variable-util-node', () => {
	it('test CJS loading', () => {
		const {FileConfigLoader} = require('@avanio/variable-util-node');
		expect(FileConfigLoader).toBeInstanceOf(Object);
	});
	it('test ESM loading', async () => {
		const {FileConfigLoader} = await import('@avanio/variable-util-node');
		expect(FileConfigLoader).toBeInstanceOf(Object);
	});
});
