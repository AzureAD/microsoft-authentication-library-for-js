/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type NetworkResponse<T> = {
    headers: Map<string, string>;
    body: T;
    status: number;
};

// TODO placeholder: this will be filled in by the throttling PR
export class NetworkManager {}
