/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthorizationCodeModule } from "msal-common";

export abstract class IInteractionHandler {

    protected authModule: AuthorizationCodeModule;

    constructor(authCodeModule: AuthorizationCodeModule) {
        this.authModule = authCodeModule;
    }
    
    /**
     * Function to handle user interaction.
     * @param urlNavigate 
     */
    abstract showUI(urlNavigate: string): void;
}
