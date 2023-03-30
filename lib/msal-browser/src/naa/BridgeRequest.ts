/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type BridgeRequest<T> = {
    requestId: string;
    method: string;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};
