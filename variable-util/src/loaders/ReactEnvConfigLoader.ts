import {IConfigLoader, LoaderValue} from '../interfaces/IConfigLoader';

export function reactEnv(overrideKey?: string | undefined): IConfigLoader {
	return {
		type: 'react-env',
		callback: async (lookupKey): Promise<LoaderValue> => {
			const targetKey = `REACT_APP_${overrideKey || lookupKey}`;
			return {type: 'react-env', value: process.env[targetKey], path: `process.env.${targetKey}`};
		},
	};
}
