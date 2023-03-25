# @avanio/variable-util

## getConfigVariable

getConfigVariable is a utility function that extracts configuration values from different sources like environment variables and even fetches remote configuration values.
Also have ability to parse (and verify) string, URL and JSON stringified or semicolon separated object values.

## Installation

```bash
npm i @avanio/variable-util
```

## Usage examples

```typescript
import {
	env,
	FetchConfigLoader,
	getConfigVariable,
	JsonConfigParser,
	SemicolonConfigParser,
	stringParser,
	UrlParser,
	ValidateCallback,
} from '@avanio/variable-util';

// example zod schema for the object validation
const objectSchema = z.object({
	foo: z.string(),
	baz: z.string(),
});

type ObjectSchema = z.infer<typeof objectSchema>;

// And optional object validation callback function
const validate: ValidateCallback<ObjectSchema> = async (data: ObjectSchema) => {
	const result = await objectSchema.safeParseAsync(data);
	if (!result.success) {
		return {success: false, message: result.error.message};
	}
	return {success: true};
};

// Define the parser instances for the config values
const semicolonConfigParser = new SemicolonConfigParser<ObjectSchema>({validate}); // optional validate callback
const jsonConfigParser = new JsonConfigParser<ObjectSchema>({validate});  // optional validate callback
const urlParser = new UrlParser({urlSanitize: true}); // urlSanitize hides credentials from logs

// optional logger function
setLogger(console); // or log4js instance

// Define the fetch config loader instances and callback to build the request
const callbackToBuildRequest = async (): Promise<Request> => {
	return new Request('https://example.com/config.json');
};
const fetchEnv = new FetchConfigLoader(callbackToBuildRequest).getLoader;
// note: fetchEnv can overrider key we are looking for fetchEnv('SOME_OTHER_KEY');

// usually all variables are loaded same way, so you can define the loaders array just once.
const loaders = [reactEnv(), fetchEnv()];

// examples with different loaders and parsers
const valueFromEnv = getConfigVariable('TEST', [env()], stringParser, undefined, {showValue: true});
// valueFromEnv: Promise<string | undefined>
const valueFromReactEnv = getConfigVariable('TEST', [env(), reactEnv()], stringParser, undefined, {showValue: true});
// valueFromReactEnv: Promise<string | undefined>
const valueFromProcessEnv = getConfigVariable('TEST', [env(), reactEnv()], stringParser, undefined, {showValue: true});
// valueFromProcessEnv: Promise<string | undefined>
const valueFromFetch = getConfigVariable('API_SERVER', [reactEnv(), fetchEnv()], urlParser, undefined, {showValue: true});
// valueFromFetch: Promise<URL | undefined>
const valueFromSemicolonConfig = getConfigVariable('TEST', [env()], semicolonConfigParser, undefined, {showValue: true});
// valueFromSemicolonConfig: Promise<ObjectSchema | undefined>
const valueFromJsonConfig = getConfigVariable('TEST', [env()], jsonConfigParser, undefined, {showValue: true});
// valueFromJsonConfig: Promise<ObjectSchema | undefined>
```

## getConfigVariable arguments:

`getConfigVariable<Output>(key: string, loaders: ConfigLoader[], parser: ConfigParser, defaultValue?: Output, options?: {showValue?: boolean}): Promise<Output | undefined>`

If defaultValue is provided, the function will return the defaultValue if no value is found and type override is applied to function return type.

`getConfigVariable<Output>(key: string, loaders: ConfigLoader[], parser: ConfigParser, defaultValue: Output, options?: {showValue?: boolean}): Promise<Output>`

- key: The key of the configuration value.
- loaders: An array of IConfigLoader instances that can load the configuration value from different sources.
- parser: An instance of IConfigParser that can parse and optionally validate expected format.
- defaultValue: The default value to be returned if no value is found.
- options: An object with an optional showValue boolean property. If true, logs also the value to logger.

## Current loaders:

### `env(): IConfigLoader`

A IConfigLoader instance that loads configuration values from the process.env.

### `reactEnv(): IConfigLoader`

A IConfigLoader instance that loads configuration values from the process.env. with REACT_APP_ prefix.

### `new FetchConfigLoader(() => Promise<Response>, options?: FetchConfigLoaderOptions).getLoader: IConfigLoader`

A IConfigLoader instance that loads configuration values from a remote source.

Note: ___getLoader___ is function generator which can override key we are looking for example, fetchEnv() with default key or fetchEnv('OVERRIDE_KEY')

- options.fetchClient (optional): A fetch client that can be used to fetch the remote configuration value.
- options.isSilent (optional): No throw error if fetch fails. Returns empty object instead.
- options.payload (optional): Only 'json' is supported. And default is 'json'.
- options.validate (optional): An optional async function that can validate the fetched object to be valid `Record<string, string>`



### How to build a custom loader:
see [IConfigLoader](./src/interfaces/IConfigLoader.ts) or extend abstract class [ConfigLoader](./src/loaders/ConfigLoader.ts)

## Current parsers:

### `stringParser(value: string): IConfigParser<string>`

A function that simply returns the given string value and validates this value to be a string.

### `new UrlParser(options?: {urlSanitize?: boolean}): IConfigParser<URL>`

A ConfigParser instance that parses the loaded value to a URL object.

- options.urlSanitize: If true, removes credentials from logs.

### `new SemicolonConfigParser<Output>(options?: {validate?: ValidateCallback<Output>, keysToHide?: string[], keepCase = true}): IConfigParser<Output>`

A SemicolonConfigParser instance that parses semi-colon separated key-value pairs to an object.

example input string: `foo=bar;baz=qux` output: `{foo: 'bar', baz: 'qux'}`

- options.validate: An optional function that can validate the parsed object.
- options.keysToHide: An optional array of keys that should be hidden from logs.
- options.keepCase: If true, keeps the case of the keys, else converts first letter to lower case.

### `new JsonConfigParser<Output>(options?: {validate?: ValidateCallback<Output>, keysToHide?: string[], keepCase = true}): IConfigParser<Output>`

A JsonConfigParser instance that parses JSON stringified object to an object.

example input string: `'{"foo":"bar","baz":"qux"}'` output: `{foo: 'bar', baz: 'qux'}`

- options.validate: An optional function that can validate the parsed object.
- options.keysToHide: An optional array of keys that should be hidden from logs.
