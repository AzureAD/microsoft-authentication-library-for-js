/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthorizationCodeModule, AuthenticationParameters } from "msal-common";
import { BrowserStorage } from "../cache/BrowserStorage";

export abstract class IInteractionHandler {

    protected authModule: AuthorizationCodeModule;
    protected browserStorage: BrowserStorage;

    constructor(authCodeModule: AuthorizationCodeModule, storageImpl: BrowserStorage) {
        this.authModule = authCodeModule;
        this.browserStorage = storageImpl;
    }

    /**
     * Function to enable user interaction.
     * @param urlNavigate 
     */
    abstract showUI(authRequest: AuthenticationParameters): void;

    /**
     * Function to handle response parameters from hash.
     * @param hash 
     */
    abstract async handleCodeResponse(hash: string): Promise<void>;
}
