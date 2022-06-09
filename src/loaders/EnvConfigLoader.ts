import {Loader} from '.';

export const env = (key?: string | undefined): Loader => {
	return {
		type: 'env',
		callback: (rootKey) => {
			const targetKey = key || rootKey;
			return Promise.resolve({key: rootKey, value: process.env[targetKey], path: `process.env.${targetKey}`});
		},
	};
};
