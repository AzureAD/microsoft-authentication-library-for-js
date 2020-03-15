/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ScopeSet } from "./ScopeSet";
import { StringUtils } from "./../utils/StringUtils";
import { ClientConfigurationError } from "./../error/ClientConfigurationError";
import { PromptValue } from "./../utils/Constants";

/**
 * Validates server consumable params from the "request" objects
 */
export class RequestValidator {
    /**
     * Utility to validate scopes and add them to the queryParams
     */
    static validateAndGenerateScopes(
        scopes: Array<string>,
        clientId: string
    ): Array<string> {
        // Set scopes and append default scopes
        const scopeSet = new ScopeSet(scopes || [], clientId, false, true);
        return scopeSet.asArray();
    }

    /**
     *
     * @param redirectUri
     */
    static validateRedirectUri(redirectUri: string) {
        // check if the redirectUri is null, set to default
        if (StringUtils.isEmpty(redirectUri)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }
    }

    /**
     * Utility to validate and add prompt to the queryParams
     * @param prompt
     */
    static validatePrompt(prompt: string) {
        // validate prompt parameter
        if (
            [
                PromptValue.LOGIN,
                PromptValue.SELECT_ACCOUNT,
                PromptValue.CONSENT,
                PromptValue.NONE
            ].indexOf(prompt) < 0
        ) {
            throw ClientConfigurationError.createInvalidPromptError(prompt);
        }
    }
}
