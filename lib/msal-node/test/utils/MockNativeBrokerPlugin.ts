/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    AuthenticationResult,
    INativeBrokerPlugin,
} from "@azure/msal-common";
import {
    mockNativeAuthenticationResult,
    mockNativeAccountInfo,
} from "./TestConstants.js";

export class MockNativeBrokerPlugin implements INativeBrokerPlugin {
    isBrokerAvailable: boolean = true;

    setLogger(): void {
        return;
    }

    getAccountById(): Promise<AccountInfo> {
        return Promise.resolve(mockNativeAccountInfo);
    }

    getAllAccounts(): Promise<AccountInfo[]> {
        return Promise.resolve([mockNativeAccountInfo]);
    }

    acquireTokenSilent(): Promise<AuthenticationResult> {
        return Promise.resolve(mockNativeAuthenticationResult);
    }

    acquireTokenInteractive(): Promise<AuthenticationResult> {
        return Promise.resolve(mockNativeAuthenticationResult);
    }

    signOut(): Promise<void> {
        return Promise.resolve();
    }
}
