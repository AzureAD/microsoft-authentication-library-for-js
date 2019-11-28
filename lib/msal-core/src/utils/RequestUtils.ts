/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationParameters } from "../AuthenticationParameters";
import { Constants, PromptState, BlacklistedEQParams } from "../utils/Constants";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ScopeSet } from "../ScopeSet";
import { StringDict } from "../MsalTypes";
import { StringUtils } from "../utils/StringUtils";
import { CryptoUtils } from "../utils/CryptoUtils";

/**
 * @hidden
 */
export class RequestUtils {

    /**
     * @ignore
     *
     * @param request
     * @param isLoginCall
     * @param requestType
     * @param redirectCallbacksSet
     * @param cacheStorage
     * @param clientId
     *
     * validates all request parameters and generates a consumable request object
     */
    static validateRequest(request: AuthenticationParameters, isLoginCall: boolean, clientId: string, requestType?: string, redirectCallbacksSet?: boolean): AuthenticationParameters {

        // Throw error if request is empty for acquire * calls
        if(!isLoginCall && !request) {
            throw ClientConfigurationError.createEmptyRequestError();
        }

        // Throw error if callbacks are not set before redirect
        if(requestType == Constants.interactionTypeRedirect && !redirectCallbacksSet) {
            throw ClientConfigurationError.createRedirectCallbacksNotSetError();
        }

        let scopes: Array<string>;
        let extraQueryParameters: StringDict;

        if(request) {
            // if extraScopesToConsent is passed in loginCall, append them to the login request; Validate and filter scopes (the validate function will throw if validation fails)
            scopes = isLoginCall ? ScopeSet.appendScopes(request.scopes, request.extraScopesToConsent) : request.scopes;
            ScopeSet.validateInputScope(scopes, !isLoginCall, clientId);

            // validate prompt parameter
            this.validatePromptParameter(request.prompt);

            // validate extraQueryParameters
            extraQueryParameters = this.validateEQParameters(request.extraQueryParameters, request.claimsRequest);

            // validate claimsRequest
            this.validateClaimsRequest(request.claimsRequest);

        }

        // validate and generate state and correlationId
        const state = this.validateAndGenerateState(request && request.state);
        const correlationId = this.validateAndGenerateCorrelationId(request && request.correlationId);

        const validatedRequest: AuthenticationParameters = {
            ...request,
            extraQueryParameters,
            scopes,
            state,
            correlationId
        };

        return validatedRequest;
    }

    /**
     * @ignore
     *
     * Utility to test if valid prompt value is passed in the request
     * @param request
     */
    static validatePromptParameter (prompt: string) {
        if(prompt) {
            if ([PromptState.LOGIN, PromptState.SELECT_ACCOUNT, PromptState.CONSENT, PromptState.NONE].indexOf(prompt) < 0) {
                throw ClientConfigurationError.createInvalidPromptError(prompt);
            }
        }
    }

    /**
     * @ignore
     *
     * Removes unnecessary or duplicate query parameters from extraQueryParameters
     * @param request
     */
    static validateEQParameters(extraQueryParameters: StringDict, claimsRequest: string) : StringDict {
        const eQParams : StringDict = { ...extraQueryParameters};
        if (!eQParams) {
            return null;
        }
        if (claimsRequest) {
            // this.logger.warning("Removed duplicate claims from extraQueryParameters. Please use either the claimsRequest field OR pass as extraQueryParameter - not both.");
            delete eQParams[Constants.claims];
        }
        BlacklistedEQParams.forEach(param => {
            if (eQParams[param]) {
                // this.logger.warning("Removed duplicate " + param + " from extraQueryParameters. Please use the " + param + " field in request object.");
                delete eQParams[param];
            }
        });

        return eQParams;
    }

    /**
     * @ignore
     *
     * Validates the claims passed in request is a JSON
     * TODO: More validation will be added when the server team tells us how they have actually implemented claims
     * @param claimsRequest
     */
    static validateClaimsRequest(claimsRequest: string) {
        if (!claimsRequest) {
            return;
        }
        let claims;
        try {
            claims = JSON.parse(claimsRequest);
        } catch (e) {
            throw ClientConfigurationError.createClaimsRequestParsingError(e);
        }
    }

    /**
     * @ignore
     *
     * generate unique state per request
     * @param request
     */
    static validateAndGenerateState(state: string): string {
        // append GUID to user set state  or set one for the user if null
        return !StringUtils.isEmpty(state) ? CryptoUtils.createNewGuid() + "|" + state : CryptoUtils.createNewGuid();
    }

    /**
     * @ignore
     *
     * validate correlationId and generate if not valid or not set by the user
     * @param correlationId
     */
    static validateAndGenerateCorrelationId(correlationId: string): string {
        // validate user set correlationId or set one for the user if null
        if(correlationId && !CryptoUtils.isGuid(correlationId)) {
            throw ClientConfigurationError.createInvalidCorrelationIdError();
        }
        return CryptoUtils.isGuid(correlationId)? correlationId : CryptoUtils.createNewGuid();
    }
}
