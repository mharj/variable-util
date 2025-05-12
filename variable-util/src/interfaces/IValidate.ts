/**
 * Interface for validation function
 * @template Input - Type of raw input
 * @template Output - Type of output
 * @since v1.0.0
 */
export type ValidateCallback<Input, Output> = (data: Input) => Output | Promise<Output>;
