import {ConfigLoader, type IConfigLoaderProps} from './ConfigLoader';
import {handleSeen} from '../lib/seenUtils';
import {type ILoggerLike} from '@avanio/logger-like';
import {type Loadable} from '../types/Loadable';
import {type LoaderValue} from '../interfaces/IConfigLoader';

export interface ISwitchLoaderProps extends IConfigLoaderProps {
	logger?: ILoggerLike;
}

/**
 * ConfigMap, this is a helper type to define the configuration map for the switch loader.
 * @template Key - The key to switch between
 * @template Map - The configuration map
 * @since v0.10.1
 * @example
 * type TestConfigMapEnv = { DEMO: string; ANOTHER: string; };
 * const swithConfigMap: SwitchConfigMap<TestConfigMapEnv, 'switch1' | 'switch2'> = {
 *   switch1: { DEMO: 'value' },
 *   switch2: { DEMO: 'value2' },
 * };
 */
export type SwitchConfigMap<Map extends Record<string, unknown>, Key extends string> = Record<Key, Partial<Record<keyof Map, string>>>;

/**
 * SwitchLoader, this loader will switch between different configurations based on the active key.
 * @example
 * type TestConfigMapEnv = { DEMO: string; ANOTHER: string; };
 * const switchLoader = new SwitchLoader<TestEnv, 'switch1' | 'switch2'>({
 *   switch1: { DEMO: 'value' },
 *   switch2: { DEMO: 'value2' },
 * });
 * const switcher = switchLoader.getLoader; // use this on the config map loaders: [switcher(), dotenv(), env(), ...]
 * await switchLoader.activateSwitch('switch1'); // when you want enable switch1 values
 * @template Config - The configuration map
 * @template Key - The key to switch between
 * @since v0.10.1
 */
export class SwitchLoader<Config extends Record<string, unknown>, Key extends string> extends ConfigLoader<string, ISwitchLoaderProps> {
	public readonly type: Lowercase<string>;
	protected override defaultOptions: ISwitchLoaderProps | undefined;
	private readonly config: Readonly<SwitchConfigMap<Config, Key>>;
	private readonly keys = new Set<Key>();
	private readonly seen = new Map<string, string>();

	constructor(configs: SwitchConfigMap<Config, Key>, props: Loadable<ISwitchLoaderProps> = {}, type: Lowercase<string> = 'switch') {
		super(props);
		this.config = configs;
		this.type = type;
	}

	public async activateSwitch(key: Key) {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`activating key '${String(key)}' => [${this.getConfigKeys(key).join(', ')}]`));
		this.keys.add(key);
	}

	public async deactivateSwitch(key: Key) {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`deactivating key '${String(key)}' => [${this.getConfigKeys(key).join(', ')}]`));
		this.keys.delete(key);
	}

	public getCurrentKeys(): Readonly<Set<Key>> {
		return this.keys;
	}

	protected async handleLoader(lookupKey: string, overrideKey?: string): Promise<LoaderValue> {
		const options = await this.getOptions();
		if (options.disabled) {
			return {type: this.type, result: undefined};
		}
		const targetKey = overrideKey ?? lookupKey;
		let output: LoaderValue = {type: this.type, result: undefined};
		for (const key of Array.from(this.keys)) {
			const currentValue = this.config[key][targetKey];
			if (currentValue) {
				output = {
					type: this.type,
					result: {value: currentValue, path: `switch:${String(key)}:${targetKey}`, seen: handleSeen(this.seen, targetKey, currentValue)},
				};
			}
		}
		return output;
	}

	protected getConfigKeys(key: Key): string[] {
		return Object.keys(this.config[key]);
	}
}
