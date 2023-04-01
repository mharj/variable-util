export type ValidateCallback<Output, RawOutput> = (data: RawOutput) => Promise<Output>;
