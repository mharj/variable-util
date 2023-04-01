import {ConfigLoader, LoaderValue} from '@avanio/variable-util/';
import {SecretClient} from '@azure/keyvault-secrets';
import {TokenCredential} from '@azure/identity';

export interface AzureSecretsConfigLoaderOptions {
	credentials: TokenCredential | (() => Promise<TokenCredential>);
	url: string | (() => Promise<string>);
}

function isTokenCredential(credentials: unknown): credentials is TokenCredential {
	return typeof credentials === 'object' && credentials !== null && 'getToken' in credentials;
}

export class AzureSecretsConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'azure-secrets';
	private client: SecretClient | undefined;
	private options: AzureSecretsConfigLoaderOptions;
	constructor(options: AzureSecretsConfigLoaderOptions) {
		super();
		this.options = options;
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const client = await this.getClient();
		const targetKey = key || rootKey;
		const {
			value,
			properties: {vaultUrl},
		} = await client.getSecret(targetKey);
		return {value, path: `${vaultUrl}/${targetKey}`};
	}

	private async getClient(): Promise<SecretClient> {
		if (!this.client) {
			const url = typeof this.options.url === 'string' ? this.options.url : await this.options.url();
			const credentials = isTokenCredential(this.options.credentials) ? this.options.credentials : await this.options.credentials();
			this.client = new SecretClient(url, credentials);
		}
		return this.client;
	}
}
