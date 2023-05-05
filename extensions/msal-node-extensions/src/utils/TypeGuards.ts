/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Returns whether or not the given object is a Node.js error
 */
export const isNodeError = (error: any): error is NodeJS.ErrnoException => {
    return (typeof error.hasOwnProperty === "function") &&
    error.hasOwnProperty("code");
}
