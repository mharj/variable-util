# variable-util

Utility to get variables from multiple resources

### UI example with react env and fetch API call

```typescript
const fetchConfig = new FetchConfigLoader(() => Promise.resolve(new Request('settings.json')));

// using method call
const configVariable = new ConfigVariables([new ReactEnvConfigLoader(), fetchConfig], {
	logger: console,
});
const backendApi = await configVariable.get('BACKEND_API', undefined, {sanitizeUrl: true});

// using direct function (binded)
export const getConfigVariable = new ConfigVariables([new ReactEnvConfigLoader(), fetchConfig], {
	logger: console,
}).get;

// without default value
const backendApi = await getConfigVariable('BACKEND_API', undefined, {sanitizeUrl: true}); // Promise <string | undefined>

// with default value
const backendApi = await getConfigVariable('BACKEND_API', 'http://localhost:1234/api', {sanitizeUrl: true}); // Promise <string>
```

More config loaders can be create with extending [ConfigLoader](./src/loaders/index.ts) abstract class.

See [FetchConfigLoader](./src/loaders/FetchConfigLoader.ts) as example
