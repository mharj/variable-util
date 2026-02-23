# @avanio/variable-util-vite

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@avanio%2Fvariable-util-vite.svg)](https://badge.fury.io/js/@avanio%2Fvariable-util-vite)
[![Maintainability](https://qlty.sh/gh/mharj/projects/variable-util/maintainability.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![Code Coverage](https://qlty.sh/gh/mharj/projects/variable-util/coverage.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![variable-util to npmjs](https://github.com/mharj/variable-util/actions/workflows/variable-util-vite.yml/badge.svg)](https://github.com/mharj/variable-util/actions/workflows/variable-util-vite.yml)

## Vite env loader for @avanio/variable-util

### install

```bash
npm i @avanio/variable-util @avanio/variable-util-vite --save
```

### [Documentation](https://mharj.github.io/variable-util/)

### Examples

```typescript
setLogger(console); // or log4js or winston
const fetchEnv = new FetchConfigLoader(() => new Request("/config.json"));
const viteEnv = new ViteEnvConfigLoader();

// single env lookup from: vite env (import.meta.env) => fetch env
const databaseUrl: URL = await getConfigVariable(
  "API_HOST",
  [viteEnv, fetchEnv],
  urlParser,
  new URL("http://localhost:3001"),
  { showValue: true },
);

// or with Config map
const loaders = [viteEnv, fetchEnv];
const urlParser = new UrlParser({ urlSanitize: true });

type EnvConfig = {
  API_HOST: URL;
};

export const envConfig = new ConfigMap<EnvConfig>({
  API_HOST: {
    loaders,
    parser: urlParser,
    defaultValue: new URL("http://localhost:3001"),
    params: { showValue: true },
  },
});

const databaseUrl: URL = await envConfig.get("API_HOST");
```
