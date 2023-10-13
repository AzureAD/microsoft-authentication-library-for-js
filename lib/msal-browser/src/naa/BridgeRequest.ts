/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type BridgeRequest<TResponse> = {
    requestId: string;
    method: string;
    resolve: (value: TResponse | PromiseLike<TResponse>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void;
};
