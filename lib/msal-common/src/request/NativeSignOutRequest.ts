/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type NativeSignOutRequest = {
    clientId: string;
    correlationId: string;
    accountId?: string;
};
