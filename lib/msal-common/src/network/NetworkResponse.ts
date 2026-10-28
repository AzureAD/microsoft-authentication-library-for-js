/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type NetworkResponse<T> = {
    /**
     * Header names are case-insensitive. Built-in clients return lowercase keys.
     */
    headers: Record<string, string>;
    body: T;
    status: number;
};
