/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthorizationCodeModule, TokenResponse } from "msal-common";
import { BrowserStorage } from "../cache/BrowserStorage";

export abstract class InteractionHandler {

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
    abstract showUI(requestUrl: string): Window;

    /**
     * Function to handle response parameters from hash.
     * @param hash 
     */
    abstract async handleCodeResponse(locationHash: string): Promise<TokenResponse>;
}
