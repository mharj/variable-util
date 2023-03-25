interface IValidateOk {
	success: true;
}

interface IValidateError {
	success: false;
	message: string;
}

export type IValidateResponse = IValidateOk | IValidateError;

export type ValidateCallback<T> = (data: T) => Promise<IValidateResponse>;
