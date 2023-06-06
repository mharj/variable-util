import {EnvMapSchema} from './types/EnvMapSchema';
import {getConfigVariable} from './getConfigVariable';

export class ConfigMap<Data extends Record<string, unknown>> {
	private schema: EnvMapSchema<Data>;
	constructor(schema: EnvMapSchema<Data>) {
		this.schema = schema;
	}

	public get<Key extends keyof Data = keyof Data>(key: Key): Promise<Data[Key]> {
		const entry = this.schema[key];
		if (!entry) {
			throw new Error(`Key ${String(key)} not found in config map`);
		}
		if (typeof key !== 'string') {
			throw new Error(`Key ${String(key)} is not a string`);
		}
		const {loaders, parser, defaultValue, params} = entry;
		return getConfigVariable<Data[Key]>(key, loaders, parser, defaultValue, params) as Promise<Data[Key]>;
	}

	public async getAll(): Promise<Data> {
		const values = await Promise.all(
			(Object.keys(this.schema) as (keyof Data)[]).map<Promise<[keyof Data, Data[keyof Data]]>>(async (key) => {
				return [key, await this.get(key as keyof Data)];
			}),
		);
		return values.reduce((result, [key, value]) => {
			result[key] = value;
			return result;
		}, {} as Data);
	}

	public async validateAll(callback: (data: Data) => void): Promise<void> {
		const data = await this.getAll();
		callback(data);
	}
}
