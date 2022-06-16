/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils } from "../utils/StringUtils";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { PromptValue, CodeChallengeMethodValues} from "../utils/Constants";
import { StringDict } from "../utils/MsalTypes";

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
        const promptValues = [];

        for (const value in PromptValue) {
            promptValues.push(PromptValue[value]);
        }

        if (promptValues.indexOf(prompt) < 0) {
            throw ClientConfigurationError.createInvalidPromptError(prompt);
        }
    }

    static validateClaims(claims: string) : void {
        try {
            JSON.parse(claims);
        } catch(e) {
            throw ClientConfigurationError.createInvalidClaimsRequestError();
        }
    }

    /**
     * Utility to validate code_challenge and code_challenge_method
     * @param codeChallenge
     * @param codeChallengeMethod
     */
    static validateCodeChallengeParams(codeChallenge: string, codeChallengeMethod: string) : void  {
        if (StringUtils.isEmpty(codeChallenge) || StringUtils.isEmpty(codeChallengeMethod)) {
            throw ClientConfigurationError.createInvalidCodeChallengeParamsError();
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

    /**
     * Removes unnecessary or duplicate query parameters from extraQueryParameters
     * @param request
     */
    static sanitizeEQParams(eQParams: StringDict, queryParams: Map<string, string>) : StringDict {
        if (!eQParams) {
            return {};
        }

        // Remove any query parameters already included in SSO params
        queryParams.forEach((value, key) => {
            if (eQParams[key]) {
                delete eQParams[key];
            }
        });

        return eQParams;
    }
}
