/**
 * This function will execute the given callback and return the result. This is
 * useful for when you want to execute a function and return the result in a
 * single line.
 *
 * If only JS could just return blocks of code...
 *
 * @param cb - The callback to execute.
 * @returns - The result of the callback.
 */
export const expr = <T>(cb: () => T): T => cb();

/**
 * This function will assert that the given value is truthy, and throw an error
 * if it is not.
 *
 * @param value - The value to assert
 * @param message - The message to throw if the assertion fails
 */
export function assert(value: unknown, message?: string): asserts value {
    if (!value) {
        throw new Error(message ?? 'assertion failed');
    }
}

/**
 * Simple function to check if the object is undefined or null
 *
 * @param {T} obj - the object to be checked
 * @return {Boolean} returns whether the object is null or undefined.
 * */
export function isDef<T>(obj: T | null | undefined): obj is T {
    return obj !== null && typeof obj !== 'undefined';
}

/**
 * Create a range of numbers.
 * 
 * @param start - the start of the range.
 * @param end - the end of the range.
 * @param step - the step of the range.
 * @returns - the range of numbers.
 */
export function range(start: number, end: number, step = 1): number[] {
    let index = -1
    let length = Math.max(Math.ceil((end - start) / (step || 1)), 0)
    const result = new Array(length)

    while (length--) {
        result[++index] = start
        start += step
      }

    return result
}
