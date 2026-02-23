# @avanio/variable-util-tachyon

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@avanio%2Fvariable-util-tachyon.svg)](https://badge.fury.io/js/@avanio%2Fvariable-util-tachyon)
[![Maintainability](https://qlty.sh/gh/mharj/projects/variable-util/maintainability.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![Code Coverage](https://qlty.sh/gh/mharj/projects/variable-util/coverage.svg)](https://qlty.sh/gh/mharj/projects/variable-util)
[![variable-util to npmjs](https://github.com/mharj/variable-util/actions/workflows/variable-util-tachyon.yml/badge.svg)](https://github.com/mharj/variable-util/actions/workflows/variable-util-tachyon.yml)

## Tachyon storage driver loader for @avanio/variable-util

### Installation

To install the necessary dependencies, run:

```sh
npm install @avanio/variable-util-tachyon @avanio/variable-util @avanio/logger-like tachyon-drive
```

### Example

```typescript
import { MemoryStorageDriver } from "tachyon-drive";
import {
  TachyonConfigLoader,
  tachyonConfigJsonStringSerializer,
} from "./tachyonConfigLoader";
import { env, getConfigVariable, stringParser } from "@avanio/variable-util";

// As example create a memory storage driver with a JSON string serializer
const driver = new MemoryStorageDriver(
  "MemoryStorageDriver",
  tachyonConfigJsonStringSerializer,
  null,
);
// Create a TachyonConfigLoader instance
const tachyonConfigLoader = new TachyonConfigLoader(driver);
tachyonConfigLoader.set("SOME_ENV", "override value"); //  Set a configuration variable

// Get the loader function
const tachyonEnv = tachyonConfigLoader.getLoader;

// Using the tachyon loader to get a configuration variable (or using ConfigMap)
const value = await getConfigVariable(
  "SOME_ENV",
  [tachyonEnv(), env()],
  stringParser(),
);
console.log(value); // 'override value'
```

### Serialization

TachyonConfigLoader have two serializer objects, one for JSON string and one for JSON string Buffer.

- `tachyonConfigJsonStringSerializer` - Serializes the configuration data to a JSON string.
- `tachyonConfigJsonBufferSerializer` - Serializes the configuration data to a JSON string as Buffer.
- `tachyonConfigJsonArrayBufferSerializer` - Serializes the configuration data to a JSON string as ArrayBuffer.
