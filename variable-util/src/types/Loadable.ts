/* eslint-disable @typescript-eslint/ban-types */
/**
 * Argument can be a value, a promise or a function that returns a value or a promise.
 */
export type Loadable<T> = T extends Function ? never : T | Promise<T> | (() => T | Promise<T>);
