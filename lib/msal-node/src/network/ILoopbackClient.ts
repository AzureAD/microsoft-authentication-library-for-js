/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationCodeResponse } from "@azure/msal-common";

/**
 * Interface for LoopbackClient allowing to replace the default loopback server with a custom implementation.
 * @public
 */
export interface ILoopbackClient {
    startServer(options: {
        successTemplate?: string;
        errorTemplate?: string;
    }): Promise<void>;
    waitForAuthCode(): Promise<ServerAuthorizationCodeResponse>;
    getRedirectUri(): string;
    closeServer(): void;
}
