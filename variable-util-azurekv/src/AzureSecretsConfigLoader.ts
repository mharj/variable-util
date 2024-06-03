import {ConfigLoader, type IConfigLoaderProps, type Loadable, type LoaderValue} from '@avanio/variable-util';
import {ExpireCache} from '@avanio/expire-cache';
import {type ILoggerLike} from '@avanio/logger-like';
import {SecretClient} from '@azure/keyvault-secrets';
import {type TokenCredential} from '@azure/identity';

export interface AzureSecretsConfigLoaderOptions extends IConfigLoaderProps {
	credentials: TokenCredential;
	url: string;
	/** hide error messages, default is true */
	isSilent?: boolean;
	logger?: ILoggerLike;
	cacheLogger?: ILoggerLike;
	/** value expire time in ms to force read again from Azure Key Vault, default is never = undefined */
	expireMs?: number;
}

export class AzureSecretsConfigLoader extends ConfigLoader<string | undefined, AzureSecretsConfigLoaderOptions, AzureSecretsConfigLoaderOptions> {
	public readonly type = 'azure-secrets';
	private client: SecretClient | undefined;
	private readonly valuePromises = new ExpireCache<Promise<{value: string | undefined; path: string}>>();

	protected defaultOptions: undefined;

	constructor(options: Loadable<AzureSecretsConfigLoaderOptions>) {
		super(options);
		this.options = options;
		void this.init();
	}

	/**
	 * Initialize AzureSecretsConfigLoader
	 * - set optional cacheLogger for cache logging
	 * - set optional expireMs for value cache
	 * @returns Promise<void> - this never throws
	 */
	public async init(): Promise<void> {
		try {
			const options = await this.getOptions();
			if (options.cacheLogger) {
				this.valuePromises.setLogger(options.cacheLogger);
			}
			if (options.expireMs !== undefined) {
				this.valuePromises.setExpireMs(options.expireMs);
			}
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Force reload all Azure Key Vault secret values
	 */
	public reload(): void {
		this.valuePromises.clear();
	}

	protected async handleLoader(rootKey: string, key?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		try {
			const targetKey = key || rootKey;
			// only read once per key
			let seen = true;
			let lastValuePromise = this.valuePromises.get(targetKey);
			if (!lastValuePromise) {
				seen = false;
				lastValuePromise = this.handleLoaderPromise(targetKey);
				this.valuePromises.set(targetKey, lastValuePromise);
			}
			const {value, path} = await lastValuePromise;
			return {type: this.type, result: {value, path, seen}};
		} catch (e) {
			if (options.isSilent === false) {
				throw e;
			}
			// if we have logger, log error as warning.
			options.logger?.warn(this.type, e);
			return {type: this.type, result: undefined};
		}
	}

	private async handleLoaderPromise(targetKey: string): Promise<{value: string | undefined; path: string}> {
		const options = await this.getOptions();
		const client = this.getAzureSecretClient(options);
		options.logger?.debug(this.type, `getting ${targetKey} from ${options.url}`);
		const {
			value,
			properties: {vaultUrl},
		} = await client.getSecret(targetKey);
		return {value, path: `${vaultUrl}/${targetKey}`};
	}

	private getAzureSecretClient(options: AzureSecretsConfigLoaderOptions): SecretClient {
		if (!this.client) {
			this.client = new SecretClient(options.url, options.credentials);
		}
		return this.client;
	}
}
