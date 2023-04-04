/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type BridgeRequest<TResponse> = {
    requestId: string;
    method: string;
    resolve: (value: TResponse | PromiseLike<TResponse>) => void;
    reject: (reason?: any) => void;
};
