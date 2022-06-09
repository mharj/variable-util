import {Loader} from '.';

export const reactEnv = (key?: string | undefined): Loader => {
	return {
		type: 'react-env',
		callback: (rootKey) => {
			const targetKey = `REACT_APP_${key || rootKey}`;
			return Promise.resolve({key: rootKey, value: process.env[targetKey], path: `process.env.${targetKey}`});
		},
	};
};
