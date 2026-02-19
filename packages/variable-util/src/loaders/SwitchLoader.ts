import type {ILoggerLike} from '@avanio/logger-like';
import type {Loadable} from '@luolapeikko/ts-common';
import {ConfigLoader, type IConfigLoaderProps, type LoaderValue} from './ConfigLoader';

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
 * const switchConfigMap: SwitchConfigMap<TestConfigMapEnv, 'switch1' | 'switch2'> = {
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
 * @since v1.0.0
 * @category Loaders
 */
export class SwitchLoader<Config extends Record<string, unknown>, Key extends string> extends ConfigLoader<ISwitchLoaderProps> {
	public readonly loaderType: Lowercase<string>;

	private readonly config: Readonly<SwitchConfigMap<Config, Key>>;
	private readonly keys = new Set<Key>();

	protected override defaultOptions: ISwitchLoaderProps = {
		disabled: false,
		logger: undefined,
	};

	public constructor(configs: SwitchConfigMap<Config, Key>, props: Loadable<Partial<ISwitchLoaderProps>> = {}, type: Lowercase<string> = 'switch') {
		super(props);
		this.config = configs;
		this.loaderType = type;
	}

	public async activateSwitch(key: Key): Promise<void> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`activating key '${String(key)}' => [${this.getConfigKeys(key).join(', ')}]`));
		this.keys.add(key);
		this.emit('updated');
	}

	public async deactivateSwitch(key: Key): Promise<void> {
		const options = await this.getOptions();
		options.logger?.debug(this.buildErrorStr(`deactivating key '${String(key)}' => [${this.getConfigKeys(key).join(', ')}]`));
		this.keys.delete(key);
		this.emit('updated');
	}

	public getCurrentKeys(): Readonly<Set<Key>> {
		return this.keys;
	}

	protected handleLoaderValue(lookupKey: string): LoaderValue | undefined {
		let output: LoaderValue | undefined;
		for (const key of Array.from(this.keys)) {
			const currentValue = this.config[key][lookupKey];
			if (currentValue) {
				output = {path: `switch:${String(key)}:${lookupKey}`, value: currentValue};
			}
		}
		return output;
	}

	protected getConfigKeys(key: Key): string[] {
		return Object.keys(this.config[key]);
	}
}
