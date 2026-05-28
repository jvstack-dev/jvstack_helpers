/**
 * Throws the given error.
 *
 * @param error - The error to throw.
 * @returns Never.
 */
function throwError(error: Error): never {
  throw error;
}

/**
 * Does nothing.
 *
 * @returns void.
 */
function noop(): void {
  // do nothing
}

/**
 * Does nothing asynchronously.
 *
 * @returns Promise that resolves to void.
 */
async function asyncNoop(): Promise<void> {
  // do nothing
}

/**
 * Returns the given value.
 *
 * @param value - The value to return.
 * @returns The given value.
 */
function identity<T>(value: T): T {
  return value;
}

/**
 * Collection of function helpers.
 *
 * @namespace functionUtils
 * @property {function} throwError - Throws the given error.
 * @property {function} noop - Does nothing.
 * @property {function} asyncNoop - Does nothing asynchronously.
 * @property {function} identity - Returns the given value.
 */
export const functionUtils = {
  throwError,
  noop,
  asyncNoop,
  identity,
};
