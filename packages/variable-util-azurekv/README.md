# @avanio/variable-util-azurekv

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@avanio%2Fvariable-util-azurekv.svg)](https://badge.fury.io/js/@avanio%2Fvariable-util-azurekv)
[![Maintainability](https://qlty.sh/gh/mharj/projects/variable-util/maintainability.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![Code Coverage](https://qlty.sh/gh/mharj/projects/variable-util/coverage.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![variable-util to npmjs](https://github.com/mharj/variable-util/actions/workflows/variable-util-azurekv.yml/badge.svg)](https://github.com/mharj/variable-util/actions/workflows/variable-util-azurekv.yml)

## Azure keyvault loader for @avanio/variable-util

### install

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
