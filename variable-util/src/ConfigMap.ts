import {Err, IResult, Ok} from 'mharj-result';
import {EnvMapSchema} from './types/EnvMapSchema';
import {getConfigObject} from './getConfigObject';
import {TypeValue} from './types/TypeValue';
import {VariableError} from './VariableError';

type TypeValueRecords<T> = Record<keyof T, TypeValue<T[keyof T]>>;

export class ConfigMap<Data extends Record<string, unknown>> {
	private schema: EnvMapSchema<Data>;
	constructor(schema: EnvMapSchema<Data>) {
		this.schema = schema;
	}

	/**
	 * get env object from config map
	 */
	public async getObject<Key extends keyof Data = keyof Data>(key: Key): Promise<TypeValue<Data[Key]>> {
		const entry = this.schema[key];
		if (!entry) {
			throw new VariableError(`Key ${String(key)} not found in config map`);
		}
		if (typeof key !== 'string') {
			throw new VariableError(`Key ${String(key)} is not a string`);
		}
		const {loaders, parser, defaultValue, params, undefinedThrowsError} = entry;
		const value = (await getConfigObject<Data[Key]>(key, loaders, parser, defaultValue, params)) as TypeValue<Data[Key]>;
		if (undefinedThrowsError && value === undefined) {
			throw new VariableError(`Key ${String(key)} is undefined`);
		}
		return value;
	}

	/**
	 * get env object from config map as Result
	 */
	public async getObjectResult<Key extends keyof Data = keyof Data>(key: Key): Promise<IResult<TypeValue<Data[Key]>>> {
		try {
			return new Ok(await this.getObject(key));
		} catch (err) {
			return new Err(err);
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
	public async getResult<Key extends keyof Data = keyof Data>(key: Key): Promise<IResult<Data[Key]>> {
		try {
			return new Ok(await this.get(key));
		} catch (err) {
			return new Err(err);
		}
	}

	public async getAll(): Promise<TypeValueRecords<Data>> {
		const values = await Promise.all(
			(Object.keys(this.schema) as (keyof Data)[]).map<Promise<[keyof Data, TypeValue<Data[keyof Data]>]>>(async (key) => {
				return [key, await this.getObject(key as keyof Data)];
			}),
		);
		return values.reduce((result, [key, value]) => {
			result[key] = value;
			return result;
		}, {} as TypeValueRecords<Data>);
	}

	public async validateAll(callback: (data: Data) => void): Promise<void> {
		const data = (Object.entries(await this.getAll()) as [[keyof Data, TypeValue<Data[keyof Data]>]]).reduce((result, [key, {value}]) => {
			result[key] = value;
			return result;
		}, {} as Data);
		callback(data);
	}
}
