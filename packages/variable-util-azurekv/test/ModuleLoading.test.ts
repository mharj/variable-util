import {describe, expect, it} from 'vitest';

describe('@avanio/variable-util-azurekv', () => {
	it('test CJS loading', () => {
		const {AzureSecretsConfigLoader} = require('@avanio/variable-util-azurekv');
		expect(AzureSecretsConfigLoader).toBeInstanceOf(Object);
	});
	it('test ESM loading', async () => {
		const {AzureSecretsConfigLoader} = await import('@avanio/variable-util-azurekv');
		expect(AzureSecretsConfigLoader).toBeInstanceOf(Object);
	});
});
