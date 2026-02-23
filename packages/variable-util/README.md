# @avanio/variable-util

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@avanio%2Fvariable-util.svg)](https://badge.fury.io/js/@avanio%2Fvariable-util)
[![Maintainability](https://qlty.sh/gh/mharj/projects/variable-util/maintainability.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![Code Coverage](https://qlty.sh/gh/mharj/projects/variable-util/coverage.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![variable-util to npmjs](https://github.com/mharj/variable-util/actions/workflows/variable-util.yml/badge.svg)](https://github.com/mharj/variable-util/actions/workflows/variable-util.yml)


## NodeJS Installation

```bash
npm i @avanio/variable-util
```

## Browser Installation (use browserify events for compatibility)

```bash
npm i @avanio/variable-util events
```

## [Documentation](https://mharj.github.io/variable-util/)

- [ConfigMap](https://mharj.github.io/variable-util/classes/ConfigMap.html)
- [getConfigVariable](https://mharj.github.io/variable-util/functions/getConfigVariable.html)
- [getConfigVariableResult](https://mharj.github.io/variable-util/functions/getConfigVariableResult.html)
- [getConfigObject](https://mharj.github.io/variable-util/functions/getConfigObject.html)
- [getConfigObjectResult](https://mharj.github.io/variable-util/functions/getConfigObjectResult.html)

## Usage examples

### Base ConfigMap project setup

```typescript
// file: loaders.ts
const fetchEnv = new FetchConfigLoader<OverrideMap>(() => new Request('https://example.com/config.json'));
const env = new EnvConfigLoader<OverrideMap>(undefined, {PORT: 'HTTP_PORT'}); // loads from process.env, with override PORT key from HTTP_PORT value
const reactEnv = new ReactEnvConfigLoader<OverrideMap>(); // loads from process.env in react app
// other loaders like dotenv from "@avanio/variable-util-node" can be added here

export const loaders: IConfigLoader[] = [env, fetchEnv, reactEnv];

// file: envTypes.ts
export type MainEnv = {
	PORT: number;
	HOST: string;
	DEBUG: boolean;
	URL: URL;
};
export type TestEnv = {
	TEST: string;
	API_SERVER: URL;
};
// override keys helper for loaders to know current key names
export type OverrideMap = InferOverrideKeyMap<MainEnv & TestEnv>;

// file: env.ts
export const mainConfig = new ConfigMap<MainEnv>(
	{
		DEBUG: {parser: booleanParser(), defaultValue: false},
		HOST: {parser: stringParser(), defaultValue: 'localhost'},
		PORT: {parser: integerParser(), defaultValue: 3000},
		URL: {parser: new UrlParser({urlSanitize: true}), defaultValue: new URL('http://localhost:3000')},
	},
	loaders,
);
```

### Complex parsers

```typescript
// file: envParsers.ts

// Define the custom parser instances for the config values
const objectSchema = z.object({
	foo: z.string(),
	baz: z.string(),
	secret: z.string(),
});

// parses 'foo=bar;baz=qux;secret=secret' string to {foo: "bar", baz: "qux", secret: "secret"}
export const fooBarSemicolonParser = new SemicolonConfigParser({
	validate: (value) => objectSchema.parse(value),
	protectedKeys: ['secret'],
	showProtectedKeys: 'prefix-suffix', // shows secret value with few characters from start and end on logging
});

// parses '{"foo": "bar", "baz": "qux", "secret": "secret"}' string to {foo: "bar", baz: "qux", secret: "secret"}
export const fooBarJsonParser = new JsonConfigParser({
	validate: (value) => objectSchema.parse(value),
	protectedKeys: ['secret'],
	showProtectedKeys: 'prefix-suffix', // shows secret value with few characters from start and end on logging
});

export const urlParser = new UrlParser({urlSanitize: true}); // urlSanitize hides credentials from logs
```

### Legacy setup

```typescript
const fetchEnv = new FetchConfigLoader(() => new Request('https://example.com/config.json'));
const env = new EnvConfigLoader(); // loads from process.env
const reactEnv = new ReactEnvConfigLoader(); // loads from process.env in react app
export const loaders: IConfigLoader[] = [env, fetchEnv, reactEnv];

const valueFromEnv = getConfigVariable('TEST', loaders, stringParser(), undefined, {showValue: true});
```
