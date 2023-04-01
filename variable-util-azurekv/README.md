# variable-util-node

Azure keyvault loader for @avanio/variable-util-azurekv

## install

```bash
npm i @avanio/variable-util @avanio/variable-util-azurekv --save
```

### Examples

```typescript
setLogger(console); // or log4js or winston
// Azure KV loader
const credentials = new ClientSecretCredential(tenantId, clientId, clientSecret); // or any other Azure credentials (managed identity, etc.)
const kvEnv = new AzureSecretsConfigLoader({credentials: azureSp, url: async () => `${process.env.KV_URI}`}).getLoader;
const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
// parser instaces
const urlParser = new UrlParser({urlSanitize: true}); // urlSanitize hides credentials from logs

// lookup from: env process.env.DATABASE_URI => JSON file "settings.json" DATABASE_URI key => keyvault process.env.KV_URI name  "zz-yy-database"
const databaseUrl: URL = await getConfigVariable('DATABASE_URI', [env(), fileEnv(), kvEnv('zz-yy-database')], urlParser, new URL('db://localhost'), {
	showValue: true,
});
```


### `new AzureSecretsConfigLoader(options).getLoader: IConfigLoader`

A IConfigLoader instance that loads configuration values from Azure Keyvault secrets.

Note: **_getLoader_** is function generator which can override key we are looking for example, kvEnv() with default key or kvEnv('OVERRIDE_KEY')

- options.credentials (required): Either a `TokenCredential` or a function that returns a `Promise` for a `TokenCredential`.
- options.url (required): Either a `string` or a function that returns a `Promise` for a `string`. The Azure Key Vault URL.