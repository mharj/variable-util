# @avanio/variable-util-node

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@avanio%2Fvariable-util-node.svg)](https://badge.fury.io/js/@avanio%2Fvariable-util-node)
[![Maintainability](https://qlty.sh/gh/mharj/projects/variable-util/maintainability.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![Code Coverage](https://qlty.sh/gh/mharj/projects/variable-util/coverage.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![variable-util to npmjs](https://github.com/mharj/variable-util/actions/workflows/variable-util-node.yml/badge.svg)](https://github.com/mharj/variable-util/actions/workflows/variable-util-node.yml)

## NodeJS loaders for @avanio/variable-util


### install

```bash
npm i @avanio/variable-util @avanio/variable-util-node --save
```

### [Documentation](https://mharj.github.io/variable-util/)

### Examples

```typescript
setLogger(console); // or log4js or winston
// Docker secret files
const dockerEnv = new DockerSecretsConfigLoader({fileLowerCase: true}).getLoader;
// settings json file (i.e. modified on pipeline or agent)
const fileEnv = new FileConfigLoader({fileName: './settings.json', type: 'json'}).getLoader;
const fileEnv = new FileConfigLoader(async () => ({fileName: './settings.json', type: 'json'})).getLoader;

const urlParser = new UrlParser({urlSanitize: true}); // urlSanitize hides credentials from logs

// lookup from: env => JSON file "settings.json" => Docker "/run/secrets/database_uri"
const databaseUrl: URL = await getConfigVariable('DATABASE_URI', [env(), fileEnv(), dockerEnv()], urlParser, undefined, {showValue: true});

// example override key: env => JSON file "settings.json" => Docker "/run/secrets/xxyyzz-database"
const databaseUrl: URL = await getConfigVariable('DATABASE_URI', [env(), fileEnv(), dockerEnv('xxyyzz-database')], urlParser, undefined, {showValue: true});

// lookup from: env => JSON file "settings.json" with key MONGODB => Docker "/run/secrets/database_uri"
const databaseUrl: URL = await getConfigVariable('DATABASE_URI', [env(), fileEnv('MONGODB'), dockerEnv()], urlParser, undefined, {showValue: true});
```
