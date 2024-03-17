/**
 * Module description:   src/lib/debounce.js
 *
 * Created on 08/08/2023
 * @author Alexander. E. Fedotov
 * @email <alexander.fedotov.uk@gmail.com>
 */

import {useEffect, useState} from 'react';

/**
 * debounce prevents a particular function from being called until after a given
 * cool-down period (default 100ms). Every time the function is called, it resets
 * the cool-down.
 *
 * @param {Function} fn - function to be executed after cool-down.
 * @param {Number} threshold - Time in milliseconds for the cool-down to last
 * @return {Function} original function that is now debounced.
 */

export default function debounce(fn: () => void, threshold = 100) {
    let deferTimer: NodeJS.Timeout | null = null;

    const debounced = () => {
        if (deferTimer) {
            clearTimeout(deferTimer);
        }

        deferTimer = setTimeout(() => {
            deferTimer = null;
            fn();
        }, threshold);
    };

    debounced.clearTimeout = () => {
        if (deferTimer) {
            clearTimeout(deferTimer);
        }
    };

    return debounced;
}

/**
 * This is the debounce function wrapper in the form of a React hook. It
 * will disallow the updating of the 'value' until the threshold delay is
 * finished. Once so, it will update the most recent value.
 *
 * @param {Object|String} value - The value to be de-bounced
 * @param {Number} threshold - The threshold the function should wait until it unlocks value updating.
 * @returns {Object|String} the de-bounced value.
 * */
export function useDebounce<T>(value: T, threshold = 100): T {
    // State and setters for debounced value
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(
        () => {
            // Set debouncedValue to value (passed in) after the specified delay
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, threshold);

            // Return a cleanup function that will be called every time ...
            // ... useEffect is re-called. useEffect will only be re-called ...
            // ... if value changes (see the inputs array below).
            // This is how we prevent debouncedValue from changing if value is ...
            // ... changed within the delay period. Timeout gets cleared and restarted.
            // To put it in context, if the user is typing within our app's ...
            // ... search box, we don't want the debouncedValue to update until ...
            // ... they've stopped typing for more than 500ms.
            return () => {
                clearTimeout(handler);
            };
        },
        // Only re-call effect if value changes
        // You could also add the "delay" var to inputs array if you ...
        // ... need to be able to change that dynamically.
        [threshold, value],
    );

    return debouncedValue;
}
