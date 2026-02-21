# variable-util-node

Azure keyvault loader for @avanio/variable-util-azurekv

## install

```bash
npm i @avanio/variable-util @avanio/variable-util-azurekv --save
```

### Examples

```typescript
const secretClient = new SecretClient(
  vaultUrl,
  new ClientSecretCredential(tenantId, clientId, clientSecret), // or any other Azure credentials (managed identity, etc.)
);
// loaders example
const env = new EnvConfigLoader();
const fileEnv = new FileConfigLoader({
  fileName: "./settings.json",
  type: "json",
});
// note: mapping must exists, else KV secrets lookup does not happen.
const kvEnv = new AzureSecretsConfigLoader(async () => ({ secretClient }), {
  DATABASE_URI: "production-database-url", // if variable lookup key is "DATABASE_URI" we pull "production-database-url" value from Azure KV secrets
});
// parser instaces
const urlParser = new UrlParser({ urlSanitize: true }); // urlSanitize hides credentials from logs

// config map setup
type MainEnv = {
  DATABASE_URI: URL;
};
export const mainConfig = new ConfigMap<MainEnv>(
  {
    DATABASE_URI: {
      defaultValue: new URL("mysql://localhost"),
      parser: urlParser,
    },
  },
  [env, fileEnv, kvEnv],
);

const databaseUri = await mainConfig.get("DATABASE_URI");
```
