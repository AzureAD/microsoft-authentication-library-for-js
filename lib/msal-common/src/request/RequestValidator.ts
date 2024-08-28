/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import { PromptValue, CodeChallengeMethodValues } from "../utils/Constants.js";

/**
 * Validates server consumable params from the "request" objects
 */
export class RequestValidator {
    /**
     * Utility to check if the `redirectUri` in the request is a non-null value
     * @param redirectUri
     */
    static validateRedirectUri(redirectUri: string): void {
        if (!redirectUri) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.redirectUriEmpty
            );
        }
    }

    /**
     * Utility to validate prompt sent by the user in the request
     * @param prompt
     */
    static validatePrompt(prompt: string): void {
        const promptValues = [];

        for (const value in PromptValue) {
            promptValues.push(PromptValue[value]);
        }

        if (promptValues.indexOf(prompt) < 0) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidPromptValue
            );
        }
    }

    static validateClaims(claims: string): void {
        try {
            JSON.parse(claims);
        } catch (e) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidClaims
            );
        }
    }

    /**
     * Utility to validate code_challenge and code_challenge_method
     * @param codeChallenge
     * @param codeChallengeMethod
     */
    static validateCodeChallengeParams(
        codeChallenge: string,
        codeChallengeMethod: string
    ): void {
        if (!codeChallenge || !codeChallengeMethod) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.pkceParamsMissing
            );
        } else {
            this.validateCodeChallengeMethod(codeChallengeMethod);
        }
    }

    /**
     * Utility to validate code_challenge_method
     * @param codeChallengeMethod
     */
    static validateCodeChallengeMethod(codeChallengeMethod: string): void {
        if (
            [
                CodeChallengeMethodValues.PLAIN,
                CodeChallengeMethodValues.S256,
            ].indexOf(codeChallengeMethod) < 0
        ) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidCodeChallengeMethod
            );
        }
    }
}
