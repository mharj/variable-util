import {ConfigLoader, Loadable, LoaderValue} from '@avanio/variable-util/';
import {SecretClient} from '@azure/keyvault-secrets';
import {TokenCredential} from '@azure/identity';

export interface AzureSecretsConfigLoaderOptions {
	credentials: Loadable<TokenCredential>;
	url: Loadable<string>;
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
			const url = await (typeof this.options.url === 'function' ? this.options.url() : this.options.url);
			const credentials = await (typeof this.options.credentials === 'function' ? this.options.credentials() : this.options.credentials);
			this.client = new SecretClient(url, credentials);
		}
		return this.client;
	}
}
