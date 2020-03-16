/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ScopeSet } from "./ScopeSet";
import { StringUtils } from "./../utils/StringUtils";
import { ClientConfigurationError } from "./../error/ClientConfigurationError";
import { PromptValue, CodeChallengeMethodValues } from "./../utils/Constants";

/**
 * Validates server consumable params from the "request" objects
 */
export class RequestValidator {
    /**
     * Utility to validate scopes passed by the user in the request
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
     * Utility to check if the `redirectUri` in the request is a non-null value
     * @param redirectUri
     */
    static validateRedirectUri(redirectUri: string) {
        // check if the redirectUri is null, set to default
        if (StringUtils.isEmpty(redirectUri)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }
    }

    /**
     * Utility to validate prompt sent by the user in the request
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

    /**
     * Utility to validate code_challenge and code_challenge_method
     * @param codeChallenge
     * @param codeChallengeMethod
     */
    static validateCodeChallengeParams(codeChallenge: string, codeChallengeMethod: string) {
        if (!(codeChallenge && codeChallengeMethod)) {
            throw ClientConfigurationError.createInvalidCodeChallengeParams();
        } else {
            this.validateCodeChallengeMethod(codeChallengeMethod);
        }
    }

    /**
     * Utlity to validate code_challenge_method
     * @param codeChallengeMethod
     */
    static validateCodeChallengeMethod(codeChallengeMethod: string) {
        // validate prompt parameter
        if (
            [
                CodeChallengeMethodValues.PLAIN,
                CodeChallengeMethodValues.S256
            ].indexOf(codeChallengeMethod) < 0
        ) {
            throw ClientConfigurationError.createInvalidCodeChallengeMethodError();
        }
    }
}
