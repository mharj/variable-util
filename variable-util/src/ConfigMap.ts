import {Err, Ok, Result} from 'mharj-result';
import {EnvMapSchema} from './types/EnvMapSchema';
import {getConfigObject} from './getConfigObject';
import {getLogger} from './logger';
import {LoaderTypeValue} from './types/TypeValue';
import {VariableError} from './VariableError';

/**
 * TypeValueRecords
 */
export type TypeValueRecords<T> = Record<keyof T, LoaderTypeValue<T[keyof T]>>;

/**
 * ConfigMap
 * @example
 * type ConfigEnv = {
 * 	 PORT: number;
 * 	 HOST: string;
 * 	 DEBUG: boolean;
 * 	 URL: URL;
 * };
 * const config = new ConfigMap<ConfigEnv>({
 * 	 DEBUG: {loaders: [env()], parser: booleanParser, defaultValue: false},
 * 	 HOST: {loaders: [env()], parser: stringParser, defaultValue: 'localhost'},
 * 	 PORT: {loaders: [env()], parser: integerParser, defaultValue: 3000},
 * 	 URL: {loaders: [env()], parser: new UrlParser({urlSanitize: true}), defaultValue: new URL('http://localhost:3000')},
 * });
 * console.log('port', await config.get('PORT'));
 */
export class ConfigMap<Data extends Record<string, unknown>> {
	private schema: EnvMapSchema<Data>;
	private cache = new Map<string, LoaderTypeValue<Data[keyof Data]>>();
	constructor(schema: EnvMapSchema<Data>) {
		this.schema = schema;
	}

	/**
	 * get env object from config map
	 */
	public async getObject<Key extends keyof Data = keyof Data>(key: Key): Promise<LoaderTypeValue<Data[Key]>> {
		const logger = getLogger();
		const entry = this.schema[key];
		if (!entry) {
			throw new VariableError(`ConfigMap key ${String(key)} not found in config map`);
		}
		if (typeof key !== 'string') {
			throw new VariableError(`ConfigMap key ${String(key)} is not a string`);
		}
		const {loaders, parser, defaultValue, params, undefinedThrowsError} = entry;
		if (!params || params?.cache !== false) {
			// return cached value if exists
			const cached = this.cache.get(key);
			if (cached) {
				return cached as LoaderTypeValue<Data[Key]>;
			}
		}
		const configObject = (await getConfigObject<Data[Key]>(key, loaders, parser, defaultValue, params)) as LoaderTypeValue<Data[Key]>;
		if (undefinedThrowsError && configObject.value === undefined) {
			logger?.info(`ConfigMap key ${String(key)} is undefined (expect to throw error)`);
			throw new VariableError(`ConfigMap key ${String(key)} is undefined`);
		}
		if (!params || params?.cache !== false) {
			this.cache.set(key, configObject);
		}
		return configObject;
	}

	/**
	 * get env object from config map as Result
	 */
	public async getObjectResult<Key extends keyof Data = keyof Data>(key: Key): Promise<Result<LoaderTypeValue<Data[Key]>>> {
		try {
			return Ok(await this.getObject(key));
		} catch (err) {
			return Err(err);
		}
	}

	/**
	 * get env value from config map
	 */
	public async get<Key extends keyof Data = keyof Data>(key: Key): Promise<Data[Key]> {
		return (await this.getObject(key)).value;
	}

	/**
	 * get env value from config map as Result
	 */
	public async getResult<Key extends keyof Data = keyof Data>(key: Key): Promise<Result<Data[Key]>> {
		try {
			return Ok(await this.get(key));
		} catch (err) {
			return Err(err);
		}
	}

	public async getAll(): Promise<TypeValueRecords<Data>> {
		const values = await Promise.all(
			(Object.keys(this.schema) as (keyof Data)[]).map<Promise<[keyof Data, LoaderTypeValue<Data[keyof Data]>]>>(async (key) => {
				return [key, await this.getObject(key as keyof Data)];
			}),
		);
		return values.reduce((result, [key, value]) => {
			result[key] = value;
			return result;
		}, {} as TypeValueRecords<Data>);
	}

	public async validateAll(callback: (data: Data) => void): Promise<void> {
		const data = (Object.entries(await this.getAll()) as [[keyof Data, LoaderTypeValue<Data[keyof Data]>]]).reduce((result, [key, {value}]) => {
			result[key] = value;
			return result;
		}, {} as Data);
		callback(data);
	}
}
