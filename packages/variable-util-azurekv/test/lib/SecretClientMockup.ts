import type {GetSecretOptions, KeyVaultSecret, SecretClient, SetSecretOptions} from '@azure/keyvault-secrets';

export class SecretClientMockup implements Pick<SecretClient, 'getSecret' | 'setSecret' | 'vaultUrl'> {
	public readonly vaultUrl = 'http://localhost';
	#secrets = new Map<string, string>();
	public getSecret(secretName: string, _options?: GetSecretOptions): Promise<KeyVaultSecret> {
		return Promise.resolve({
			name: secretName,
			properties: {
				contentType: undefined,
				createdOn: new Date(),
				deletedOn: undefined,
				enabled: true,
				keyId: undefined,
				managed: undefined,
				name: secretName,
				recoveryId: undefined,
				scheduledPurgeDate: undefined,
				tags: undefined,
				updatedOn: new Date(),
				vaultUrl: this.vaultUrl,
				version: '1',
			},
			value: this.#secrets.get(secretName),
		});
	}
	public setSecret(secretName: string, secretValue: string, _options?: SetSecretOptions): Promise<KeyVaultSecret> {
		this.#secrets.set(secretName, secretValue);
		return Promise.resolve({
			name: secretName,
			properties: {
				contentType: undefined,
				createdOn: new Date(),
				deletedOn: undefined,
				enabled: true,
				keyId: undefined,
				managed: undefined,
				name: secretName,
				recoveryId: undefined,
				scheduledPurgeDate: undefined,
				tags: undefined,
				updatedOn: new Date(),
				vaultUrl: this.vaultUrl,
				version: '1',
			},
			value: secretValue,
		});
	}
}
