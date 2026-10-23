/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Checks whether a value is a plain JSON-like object.
 * Allows objects with null prototypes, but rejects arrays and object subclasses.
 */
export function isPlainObject(
    value: unknown
): value is Record<string, unknown> {
    if (
        typeof value !== "object" ||
        value === null ||
        Object.prototype.toString.call(value) !== "[object Object]"
    ) {
        return false;
    }

    if (Object.getPrototypeOf(value) === null) {
        return true;
    }

    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }

    return Object.getPrototypeOf(value) === proto;
}
