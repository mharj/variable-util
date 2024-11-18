# @avanio/variable-util-tachyon

The `TachyonConfigLoader` is a configuration loader that uses a storage driver to persist and retrieve variable data. It is designed to be used with the `TachyonDrive` storage driver.

## Installation

To install the necessary dependencies, run:

```sh
npm install @avanio/variable-util-tachyon @avanio/variable-util @avanio/logger-like tachyon-drive
```

## Example

```typescript
import {MemoryStorageDriver} from 'tachyon-drive';
import {TachyonConfigLoader, tachyonConfigJsonStringSerializer} from './tachyonConfigLoader';
import {env, getConfigVariable, stringParser} from '@avanio/variable-util';

// As example create a memory storage driver with a JSON string serializer
const driver = new MemoryStorageDriver('MemoryStorageDriver', tachyonConfigJsonStringSerializer, null);
// Create a TachyonConfigLoader instance
const tachyonConfigLoader = new TachyonConfigLoader(driver);
tachyonConfigLoader.set('SOME_ENV', 'override value'); //  Set a configuration variable

// Get the loader function
const tachyonEnv = tachyonConfigLoader.getLoader;

// Using the tachyon loader to get a configuration variable (or using ConfigMap)
const value = await getConfigVariable('SOME_ENV', [tachyonEnv(), env()], stringParser());
console.log(value); // 'override value'
```

## Serialization

TachyonConfigLoader have two serializer objects, one for JSON string and one for JSON string Buffer.

- `tachyonConfigJsonStringSerializer` - Serializes the configuration data to a JSON string.
- `tachyonConfigJsonBufferSerializer` - Serializes the configuration data to a JSON string as Buffer.
