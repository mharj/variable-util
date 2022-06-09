# variable-util

Utility to get variables from multiple resources

### UI example with react env and fetch API call

```typescript
// build class based loader
const fetchEnv = new FetchConfigLoader(() => Promise.resolve(new Request('settings.json'))).getLoader;

// example: UI variables
const backendApi = await getConfigVariable('API_SERVER', [reactEnv(), fetchEnv()], undefined, {sanitizeUrl: true});

// example:  without default value
const backendApi = await getConfigVariable('BACKEND_API', [env(), someOtherEnv()], undefined, {sanitizeUrl: true}); // Promise <string | undefined>

// example:  with default value
const backendApi = await getConfigVariable('BACKEND_API', [env(), someOtherEnv()], 'http://localhost:1234/api', {sanitizeUrl: true}); // Promise <string>

// example: using root key overrides
const backendApi = await getConfigVariable('BACKEND_API', [env(), env('ANOTHER_BACKEND_API')], undefined, {sanitizeUrl: true}); // Promise <string | undefined>
```

More config loaders can be create with extending [ConfigLoader](./src/loaders/index.ts) abstract class or loader function

See [FetchConfigLoader](./src/loaders/FetchConfigLoader.ts) as example class
