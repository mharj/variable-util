/**
 * Interface for validation function
 * @template Output - Type of output
 * @template RawOutput - Type of raw output
 */
export type ValidateCallback<Output, RawOutput> = (data: RawOutput) => Promise<Output>;
