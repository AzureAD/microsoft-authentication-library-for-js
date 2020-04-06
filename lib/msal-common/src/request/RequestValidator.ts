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
     * Utility to check if the `redirectUri` in the request is a non-null value
     * @param redirectUri
     */
    static validateRedirectUri(redirectUri: string) : void {
        if (StringUtils.isEmpty(redirectUri)) {
            throw ClientConfigurationError.createRedirectUriEmptyError();
        }
    }

    /**
     * Utility to validate prompt sent by the user in the request
     * @param prompt
     */
    static validatePrompt(prompt: string) : void {
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
    static validateCodeChallengeParams(codeChallenge: string, codeChallengeMethod: string) : void  {
        if (!(codeChallenge && codeChallengeMethod)) {
            throw ClientConfigurationError.createInvalidCodeChallengeParams();
        } else {
            this.validateCodeChallengeMethod(codeChallengeMethod);
        }
    }

    /**
     * Utility to validate code_challenge_method
     * @param codeChallengeMethod
     */
    static validateCodeChallengeMethod(codeChallengeMethod: string) : void {
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
