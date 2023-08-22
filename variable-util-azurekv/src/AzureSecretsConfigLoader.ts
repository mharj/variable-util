import {ConfigLoader, Loadable, LoaderValue} from '@avanio/variable-util';
import {SecretClient} from '@azure/keyvault-secrets';
import {TokenCredential} from '@azure/identity';

export interface AzureSecretsConfigLoaderOptions {
	credentials: TokenCredential;
	url: string;
	disabled?: boolean;
	/** hide error messages, default is true */
	isSilent?: boolean;
}

export class AzureSecretsConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'azure-secrets';
	private client: SecretClient | undefined;
	private options: Loadable<AzureSecretsConfigLoaderOptions>;
	constructor(options: Loadable<AzureSecretsConfigLoaderOptions>) {
		super();
		this.options = options;
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		const client = await this.getClient(options);
		const targetKey = key || rootKey;
		try {
			const {
				value,
				properties: {vaultUrl},
			} = await client.getSecret(targetKey);
			return {type: this.type, result: {value, path: `${vaultUrl}/${targetKey}`}};
		} catch (e) {
			if (options.isSilent === false) {
				throw e;
			}
			return {type: this.type, result: undefined};
		}
	}

	private async getClient(options: AzureSecretsConfigLoaderOptions): Promise<SecretClient> {
		if (!this.client) {
			this.client = new SecretClient(options.url, options.credentials);
		}
		return this.client;
	}

	private async getOptions(): Promise<AzureSecretsConfigLoaderOptions> {
		return typeof this.options === 'function' ? this.options() : this.options;
	}
}
