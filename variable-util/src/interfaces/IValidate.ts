/**
 * Interface for validation function
 * @template Output - Type of output
 * @template RawOutput - Type of raw output
 * @since v0.2.18
 */
export type ValidateCallback<Output, RawOutput> = (data: RawOutput) => Promise<Output>;
