import {EnvMapSchema} from './types/EnvMapSchema';
import {getConfigObject} from './getConfigObject';
import {TypeValue} from './types/TypeValue';

type TypeValueRecords<T> = Record<keyof T, TypeValue<T[keyof T]>>;

export class ConfigMap<Data extends Record<string, unknown>> {
	private schema: EnvMapSchema<Data>;
	constructor(schema: EnvMapSchema<Data>) {
		this.schema = schema;
	}

	public getObject<Key extends keyof Data = keyof Data>(key: Key): Promise<TypeValue<Data[Key]>> {
		const entry = this.schema[key];
		if (!entry) {
			throw new Error(`Key ${String(key)} not found in config map`);
		}
		if (typeof key !== 'string') {
			throw new Error(`Key ${String(key)} is not a string`);
		}
		const {loaders, parser, defaultValue, params} = entry;
		return getConfigObject<Data[Key]>(key, loaders, parser, defaultValue, params) as Promise<TypeValue<Data[Key]>>;
	}

	public async get<Key extends keyof Data = keyof Data>(key: Key): Promise<Data[Key]> {
		return (await this.getObject(key)).value;
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
