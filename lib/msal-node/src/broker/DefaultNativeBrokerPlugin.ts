/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, INativeBrokerPlugin } from "@azure/msal-common";

/**
 * This is a stub implementation of the native broker plugin which only serves to act as a default value but the methods defined here should never be invoked.
 */
export class DefaultNativeBrokerPlugin implements INativeBrokerPlugin {
    isBrokerAvailable = false;
    
    setLogger(): void {
        // Do nothing
    }
    
    acquireTokenSilent(): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }

    acquireTokenInteractive(): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }

    signOut(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getAccountById(): Promise<AccountInfo> {
        throw new Error("Method not implemented.");
    }

    getAllAccounts(): Promise<AccountInfo[]> {
        throw new Error("Method not implemented.");
    }
}
