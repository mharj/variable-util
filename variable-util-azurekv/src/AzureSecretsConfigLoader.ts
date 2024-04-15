import {ConfigLoader, Loadable, LoaderValue} from '@avanio/variable-util';
import {ExpireCache} from '@avanio/expire-cache';
import {ILoggerLike} from '@avanio/logger-like';
import {SecretClient} from '@azure/keyvault-secrets';
import {TokenCredential} from '@azure/identity';

export interface AzureSecretsConfigLoaderOptions {
	credentials: TokenCredential;
	url: string;
	disabled?: boolean;
	/** hide error messages, default is true */
	isSilent?: boolean;
	logger?: ILoggerLike;
	cacheLogger?: ILoggerLike;
	/** value expire time in ms to force read again from Azure Key Vault, default is never = undefined */
	expireMs?: number;
}

export class AzureSecretsConfigLoader extends ConfigLoader<string | undefined> {
	public type = 'azure-secrets';
	private client: SecretClient | undefined;
	private options: Loadable<AzureSecretsConfigLoaderOptions>;

	private loaderValuePromises = new ExpireCache<Promise<LoaderValue>>();

	constructor(options: Loadable<AzureSecretsConfigLoaderOptions>) {
		super();
		this.options = options;
		// update expireMs from options
		this.getOptions()
			.then((options) => {
				if (options.cacheLogger) {
					this.loaderValuePromises.setLogger(options.cacheLogger);
				}
				if (options.expireMs !== undefined) {
					this.loaderValuePromises.setExpireMs(options.expireMs);
				}
			})
			.catch((e) => {
				console.log(e); // error getting options
			});
	}

	/**
	 * Force reload all Azure Key Vault secret values
	 */
	public reload(): void {
		this.loaderValuePromises.clear();
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		try {
			const targetKey = key || rootKey;
			// only read once per key
			let loaderValuePromise = this.loaderValuePromises.get(targetKey);
			if (!loaderValuePromise) {
				loaderValuePromise = this.handleLoaderPromise(targetKey, options);
				this.loaderValuePromises.set(targetKey, loaderValuePromise);
			}
			return await loaderValuePromise;
		} catch (e) {
			if (options.isSilent === false) {
				throw e;
			}
			// if we have logger, log error as warning.
			options.logger?.warn(this.type, e);
			return {type: this.type, result: undefined};
		}
	}

	private async handleLoaderPromise(targetKey: string, options: AzureSecretsConfigLoaderOptions): Promise<LoaderValue> {
		const client = await this.getClient(options);
		options.logger?.debug(this.type, `getting ${targetKey} from ${options.url}`);
		const {
			value,
			properties: {vaultUrl},
		} = await client.getSecret(targetKey);
		return {type: this.type, result: {value, path: `${vaultUrl}/${targetKey}`}};
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
