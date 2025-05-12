import {ExpireCache} from '@avanio/expire-cache';
import {type ILoggerLike} from '@avanio/logger-like';
import {ConfigLoader, type IConfigLoaderProps, type LoaderValue, type OverrideKeyMap} from '@avanio/variable-util';
import {type TokenCredential} from '@azure/identity';
import {SecretClient} from '@azure/keyvault-secrets';
import {type Loadable} from '@luolapeikko/ts-common';

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

/**
 * Mapping of keys to Azure Key Vault secrets
 * - true means get direct key  from Azure Key Vault
 * - string means map string value key from Azure Key Vault
 * @template T Keys to map to Azure Key Vault secrets
 * @since v1.0.0
 */
export type KeyVaultKeyMapping<T extends OverrideKeyMap> = Partial<Record<keyof T, string | boolean>>;

/**
 * AzureSecretsConfigLoader to get config values from Azure Key Vault secrets
 * @template OverrideKeys Keys to map to Azure Key Vault secrets.
 * @since v1.0.0
 */
export class AzureSecretsConfigLoader<OverrideKeys extends OverrideKeyMap> extends ConfigLoader<AzureSecretsConfigLoaderOptions> {
	public readonly loaderType: Lowercase<string>;
	private client: SecretClient | undefined;
	private readonly valuePromises = new ExpireCache<Promise<{value: string | undefined; path: string}>>();
	private keyMapping: KeyVaultKeyMapping<OverrideKeys>;

	protected defaultOptions: AzureSecretsConfigLoaderOptions = {
		credentials: {
			getToken: () => {
				throw new Error('credentials not set');
			},
		},
		url: 'http://localhost',
	};

	/**
	 * Create AzureSecretsConfigLoader
	 * @param {Loadable<AzureSecretsConfigLoaderOptions>} options - AzureSecretsConfigLoader options
	 * @param {KeyVaultKeyMapping<OverrideKeys>} secretsKeyMapping - mapping of keys to Azure Key Vault secrets (true means get direct key from Azure Key Vault secrets, string means map string value key from Azure Key Vault)
	 * @param {Lowercase<string>} loaderType - loader type name
	 */
	constructor(
		options: Loadable<AzureSecretsConfigLoaderOptions>,
		secretsKeyMapping: KeyVaultKeyMapping<OverrideKeys>,
		loaderType: Lowercase<string> = 'azure-secrets',
	) {
		super(options);
		this.options = options;
		this.keyMapping = secretsKeyMapping;
		this.loaderType = loaderType;
		void this.init();
	}

	/**
	 * Initialize AzureSecretsConfigLoader
	 * - set optional cacheLogger for cache logging
	 * - set optional expireMs for value cache
	 * @returns {Promise<void>} - this never throws
	 */
	public async init(): Promise<void> {
		try {
			const options = await this.getOptions();
			if (options.cacheLogger) {
				this.valuePromises.logger.setLogger(options.cacheLogger);
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

	protected async handleLoaderValue(lookupKey: string): Promise<LoaderValue | undefined> {
		const options = await this.getOptions();
		try {
			const sourceKey: string | boolean | undefined = this.keyMapping[lookupKey];
			if (!sourceKey) {
				return undefined;
			}
			const targetKey = sourceKey === true ? lookupKey : sourceKey;
			// only read once per key
			let lastValuePromise = this.valuePromises.get(targetKey);
			if (!lastValuePromise) {
				lastValuePromise = this.handleLoaderPromise(targetKey);
				this.valuePromises.set(targetKey, lastValuePromise);
			}
			return await lastValuePromise;
		} catch (e) {
			if (options.isSilent === false) {
				throw e;
			}
			// if we have logger, log error as warning.
			options.logger?.warn(this.loaderType, e);
			return undefined;
		}
	}

	private async handleLoaderPromise(targetKey: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		const client = this.getAzureSecretClient(options);
		options.logger?.debug(this.loaderType, `getting ${targetKey} from ${options.url}`);
		const {
			value,
			properties: {vaultUrl},
		} = await client.getSecret(targetKey);
		return {value, path: `${vaultUrl}/${targetKey}`};
	}

	private getAzureSecretClient(options: AzureSecretsConfigLoaderOptions): SecretClient {
		this.client ??= new SecretClient(options.url, options.credentials);
		return this.client;
	}
}
