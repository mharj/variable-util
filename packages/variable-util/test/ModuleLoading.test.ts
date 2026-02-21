import {describe, expect, it} from 'vitest';

describe('@avanio/variable-util', () => {
	it('test CJS loading', () => {
		const {ConfigMap} = require('@avanio/variable-util');
		expect(ConfigMap).toBeInstanceOf(Object);
	});
	it('test ESM loading', async () => {
		const {ConfigMap} = await import('@avanio/variable-util');
		expect(ConfigMap).toBeInstanceOf(Object);
	});
});
