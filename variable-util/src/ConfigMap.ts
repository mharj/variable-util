import type {ILoggerLike, ISetOptionalLogger} from '@avanio/logger-like';
import {Err, type IResult, Ok} from '@luolapeikko/result-option';
import {buildOptions, type ConfigOptions} from './ConfigOptions';
import {getConfigObject} from './getConfigObject';
import {type EncodeOptions} from './interfaces/IConfigParser';
import {type EnvMapSchema} from './types/EnvMapSchema';
import {type LoaderTypeValueStrict} from './types/TypeValue';
import {VariableError} from './VariableError';
import {VariableLookupError} from './VariableLookupError';

/**
 * TypeValueRecords
 */
export type TypeValueRecords<T> = Record<keyof T, LoaderTypeValueStrict<T[keyof T]>>;

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
 * @since v0.6.0
 */
export class ConfigMap<Data extends Record<string, unknown>> implements ISetOptionalLogger {
	private schema: EnvMapSchema<Data>;
	private options: ConfigOptions;
	/**
	 * ConfigMap constructor
	 * @param {EnvMapSchema<Data>} schema - schema of config map
	 * @param {ConfigOptions} options - optional config options (logger, namespace)
	 */
	constructor(schema: EnvMapSchema<Data>, options: ConfigOptions = {logger: undefined, namespace: undefined}) {
		this.schema = schema;
		this.options = options;
	}

	/**
	 * Set logger value
	 * @param {ILoggerLike | undefined} logger - logger like object
	 */
	public setLogger(logger: ILoggerLike | undefined): void {
		this.options.logger = logger;
	}

	/**
	 * get env object from config map
	 * @returns {Promise<TypeValueRecords<Data>>} Promise of env object or undefined
	 * @example
	 * const valueObject: LoaderTypeValue<number> = await config.getObject('PORT');
	 * console.log(valueObject.type, valueObject.value); // 'env', 3000
	 */
	public async getObject<Key extends keyof Data = keyof Data>(key: Key, encodeOptions?: EncodeOptions): Promise<LoaderTypeValueStrict<Data[Key]>> {
		if (typeof key !== 'string') {
			throw new VariableError(`ConfigMap key ${String(key)} is not a string`);
		}
		const entry = this.schema[key];
		if (!entry) {
			throw new VariableLookupError(key, `ConfigMap key ${String(key)} not found in config map`);
		}
		const {loaders, parser, defaultValue, params, undefinedThrowsError, undefinedErrorMessage} = entry;
		const configObject = (await getConfigObject<Data[Key]>(key, loaders, parser, defaultValue, params, this.options, encodeOptions)) as LoaderTypeValueStrict<
			Data[Key]
		>;
		if (undefinedThrowsError && configObject.value === undefined) {
			buildOptions(this.options).logger?.info(`ConfigMap key ${String(key)} is undefined (expect to throw error)`);
			throw new VariableError(undefinedErrorMessage ?? `ConfigMap key ${String(key)} is undefined`);
		}
		return configObject;
	}

	/**
	 * get env object from config map as Result
	 * @returns {Promise<Result<TypeValueRecords<Data>>>} Result Promise of env object or undefined
	 * @example
	 * const valueObject: Result<LoaderTypeValue<number>> = await config.getObjectResult('PORT');
	 * if (valueObject.isOk()) {
	 *   const {type, value} = valueObject.ok();
	 * 	 console.log(type, value); // 'env', 3000
	 * }
	 */
	public async getObjectResult<Key extends keyof Data = keyof Data>(
		key: Key,
		encodeOptions?: EncodeOptions,
	): Promise<IResult<LoaderTypeValueStrict<Data[Key]>>> {
		try {
			return Ok(await this.getObject(key, encodeOptions));
		} catch (err) {
			return Err(err);
		}
	}

	/**
	 * get env value from config map
	 * @returns {Promise<Data[Key]>} Promise of value or undefined
	 * @example
	 * const port: number = await config.get('PORT');
	 */
	public async get<Key extends keyof Data = keyof Data>(key: Key, encodeOptions?: EncodeOptions): Promise<Data[Key]> {
		return (await this.getObject(key, encodeOptions)).value;
	}

	/**
	 * get env value as string from config map
	 * @returns {Promise<string | undefined>} Promise of string value or undefined
	 * @example
	 * const port: string = await config.getString('PORT');
	 */
	public async getString<Key extends keyof Data = keyof Data>(
		key: Key,
		encodeOptions?: EncodeOptions,
	): Promise<undefined extends Data[Key] ? string | undefined : string> {
		return (await this.getObject(key, encodeOptions)).stringValue;
	}

	/**
	 * get env value from config map as Result
	 * @returns {Promise<Result<Data[Key]>>} Result Promise of value or undefined
	 * @example
	 * const port: Result<number> = await config.getResult('PORT');
	 * if (port.isOk()) {
	 * 	 console.log('port', port.ok());
	 * }
	 */
	public async getResult<Key extends keyof Data = keyof Data>(key: Key, encodeOptions?: EncodeOptions): Promise<IResult<Data[Key]>> {
		try {
			return Ok(await this.get(key, encodeOptions));
		} catch (err) {
			return Err(err);
		}
	}

	/**
	 * get env value as string from config map as Result
	 * @returns {Promise<Result<string | undefined>>} Result Promise of string value or undefined
	 * @example
	 * const port: Result<string> = await config.getStringResult('PORT');
	 * if (port.isOk()) {
	 * 	 console.log('port', port.ok());
	 * }
	 */
	public async getStringResult<Key extends keyof Data = keyof Data>(
		key: Key,
		encodeOptions?: EncodeOptions,
	): Promise<IResult<undefined extends Data[Key] ? string | undefined : string>> {
		try {
			return Ok(await this.getString(key, encodeOptions));
		} catch (err) {
			return Err(err);
		}
	}

	/**
	 * get all env value objects from config map
	 * @returns {Promise<TypeValueRecords<Data>>} Promise of all values
	 * @example
	 * const values: TypeValueRecords<Data> = await config.getAll();
	 * console.log(values.PORT.type, values.PORT.value); // 'env', 3000
	 */
	public async getAllObjects(): Promise<TypeValueRecords<Data>> {
		const values = await this.getAllPromises();
		return values.reduce<TypeValueRecords<Data>>((result, [key, value]) => {
			result[key] = value;
			return result;
		}, {} as TypeValueRecords<Data>);
	}

	/**
	 * get all env values from config map
	 * @returns {Promise<Data>} Promise of all values
	 * @example
	 * const values: Data = await config.getAllValues();
	 * console.log('PORT', values.PORT); // 3000 (number)
	 */
	public async getAllValues(): Promise<Data> {
		const values = await this.getAllPromises();
		return values.reduce<Data>((result, [key, value]) => {
			result[key] = value.value;
			return result;
		}, {} as Data);
	}

	/**
	 * get all env values from config map as string
	 * @returns {Promise<Record<keyof Data, string>>} Promise of all values as string
	 * @example
	 * const values: Record<keyof Data, string> = await config.getAllStringValues();
	 * console.log('PORT', values.PORT); // '3000' (string)
	 */
	public async getAllStringValues(encodeOptions?: EncodeOptions): Promise<Record<keyof Data, string>> {
		const values = await this.getAllPromises(encodeOptions);
		return values.reduce<Record<keyof Data, string>>(
			(result, [key, value]) => {
				result[key] = value.stringValue;
				return result;
			},
			{} as Record<keyof Data, string>,
		);
	}

	/**
	 * Validate all env values from config map, expect to throw error if error exists
	 *
	 * @param callback callback function
	 */
	public async validateAll(callback: (data: Data) => void): Promise<void> {
		const data = await this.getAllValues();
		callback(data);
	}

	/**
	 * run lookup to all keys and return all promises
	 */
	private getAllPromises(encodeOptions?: EncodeOptions): Promise<[keyof Data, LoaderTypeValueStrict<Data[keyof Data]>][]> {
		return Promise.all(
			(Object.keys(this.schema) as (keyof Data)[]).map<Promise<[keyof Data, LoaderTypeValueStrict<Data[keyof Data]>]>>(async (key) => {
				return [key, await this.getObject(key, encodeOptions)];
			}),
		);
	}
}
