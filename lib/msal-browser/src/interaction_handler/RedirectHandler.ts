/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IInteractionHandler } from "./IInteractionHandler";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { StringUtils, AuthorizationCodeModule } from "msal-common";

export class RedirectHandler extends IInteractionHandler {

    constructor(authCodeModule: AuthorizationCodeModule) {
        super(authCodeModule);
    }

    /**
     * Redirects window to given URL.
     * @param urlNavigate 
     */
    showUI(urlNavigate: string): void {
        // Navigate if valid URL
        if (urlNavigate && !StringUtils.isEmpty(urlNavigate)) {
            this.authModule.logger.infoPii("Navigate to:" + urlNavigate);
            window.location.assign(urlNavigate);
        }
        else {
            this.authModule.logger.info("Navigate url is empty");
            throw BrowserAuthError.createEmptyRedirectUriError();
        }
    }
}
