import {type PostValidate} from '../interfaces/IConfigParser';

function isLiteral<RawType, Type extends RawType>(value: RawType, values: readonly Type[]): value is Type {
	return values.includes(value as Type);
}

export function validLiteral<RawType, Type extends RawType>(values: readonly Type[]): PostValidate<Type, RawType> {
	return (key: string, value: RawType): Promise<Type | undefined> => {
		if (isLiteral<RawType, Type>(value, values)) {
			return Promise.resolve(value);
		}
		return Promise.reject(new TypeError(`value for key ${key} is not a valid literal`));
	};
}
