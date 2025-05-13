# @avanio/variable-util-vite

Vite env loader for @avanio/variable-util

## install

```bash
npm i @avanio/variable-util @avanio/variable-util-vite --save
```

## [Documentation](https://mharj.github.io/variable-util/)

### Examples

```typescript
setLogger(console); // or log4js or winston
const fetchEnv = new FetchConfigLoader(() => new Request('/config.json'));
const viteEnv = new ViteEnvConfigLoader();

// single env lookup from: vite env (import.meta.env) => fetch env
const databaseUrl: URL = await getConfigVariable('API_HOST', [viteEnv, fetchEnv], urlParser, new URL('http://localhost:3001'), {showValue: true});

// or with Config map
const loaders = [viteEnv, fetchEnv];
const urlParser = new UrlParser({urlSanitize: true});

type EnvConfig = {
	API_HOST: URL;
};

export const envConfig = new ConfigMap<EnvConfig>({
	API_HOST: {loaders, parser: urlParser, defaultValue: new URL('http://localhost:3001'), params: {showValue: true}},
});

const databaseUrl: URL = await envConfig.get('API_HOST');
```
