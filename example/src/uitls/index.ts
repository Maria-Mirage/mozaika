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
