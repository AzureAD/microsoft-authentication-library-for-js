/*
* Copyright (c) Microsoft Corporation. All rights reserved.
* Licensed under the MIT License.
*/

import { AADServerParamKeys, Constants, Prompt, ResponseMode, SSOTypes, ClientInfo } from "../utils/Constants";
import { ScopeSet } from "../request/ScopeSet";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { StringDict } from "../utils/MsalTypes";
import { RequestValidator } from '../request/RequestValidator';

export class RequestParameterBuilder {

    private parameters: Map<string, string>;

    constructor(){
        this.parameters = new Map<string, string>();
    }

    /**
     * add response_type = code
     */
    addResponseTypeCode(): void {
        this.parameters.set(
            AADServerParamKeys.RESPONSE_TYPE, encodeURIComponent(Constants.CODE_RESPONSE_TYPE)
        );
    }

    /**
     * add response_mode. defaults to query.
     * @param responseMode
     */
    addResponseMode(responseMode?: ResponseMode): void {
        this.parameters.set(
            AADServerParamKeys.RESPONSE_MODE,
            encodeURIComponent((responseMode) ? responseMode : ResponseMode.QUERY)
        );
    }

    /**
     * add scopes
     * @param scopeSet
     */
    addScopes(scopeSet: ScopeSet): void {
        this.parameters.set(AADServerParamKeys.SCOPE, encodeURIComponent(scopeSet.printScopes())
        );
    }

    /**
     * add clientId
     * @param clientId
     */
    addClientId(clientId: string): void {
        this.parameters.set(AADServerParamKeys.CLIENT_ID, encodeURIComponent(clientId)
        );
    }

    /**
     * add redirect_uri
     * @param redirectUri
     */
    addRedirectUri(redirectUri: string): void {
        this.parameters.set(AADServerParamKeys.REDIRECT_URI, encodeURIComponent(redirectUri)
        );
    }

    /**
     * add domain_hint
     * @param domainHint
     */
    addDomainHint(domainHint: string): void {
        this.parameters.set(SSOTypes.DOMAIN_HINT, encodeURIComponent(domainHint));
    }

    /**
     * add login_hint
     * @param loginHint
     */
    addLoginHint(loginHint: string): void {
        this.parameters.set(SSOTypes.LOGIN_HINT, encodeURIComponent(loginHint));
    }

    /**
     * add claims
     * @param claims
     */
    addClaims(claims: string): void {
        this.parameters.set(AADServerParamKeys.CLAIMS, encodeURIComponent(claims));
    }

    /**
     * add correlationId
     * @param correlationId
     */
    addCorrelationId(correlationId: string): void {
        this.parameters.set(AADServerParamKeys.CLIENT_REQUEST_ID, encodeURIComponent(correlationId)
        );
    }

    /**
     * add prompt
     * @param prompt
     */
    addPrompt(prompt: Prompt): void {
        this.parameters.set(`${AADServerParamKeys.PROMPT}`, encodeURIComponent(prompt));
    }

    /**
     * add state
     * @param state
     */
    addState(state: string): void {
        this.parameters.set(AADServerParamKeys.STATE, encodeURIComponent(state));
    }

    /**
     * add nonce
     * @param nonce
     */
    addNonce(nonce: string): void {
        this.parameters.set(AADServerParamKeys.NONCE, encodeURIComponent(nonce));
    }

    /**
     * add code_challenge and code_challenge_method
     * - throw if either of them are not passed
     * @param codeChallenge
     * @param codeChallengeMethod
     */
    addCodeChallengeParams(
        codeChallenge: string,
        codeChallengeMethod: string
    ): void {
        if (codeChallenge && codeChallengeMethod) {
            this.parameters.set(AADServerParamKeys.CODE_CHALLENGE, encodeURIComponent(codeChallenge));
            this.parameters.set(AADServerParamKeys.CODE_CHALLENGE_METHOD, encodeURIComponent(codeChallengeMethod));
        } else {
            throw ClientConfigurationError.createInvalidCodeChallengeParamsError();
        }
    }

    /**
     * add the `authorization_code` passed by the user to exchange for a token
     * @param code
     */
    addAuthorizationCode(code: string): void {
        this.parameters.set(AADServerParamKeys.CODE, encodeURIComponent(code));
    }

    /**
     * add the `authorization_code` passed by the user to exchange for a token
     * @param code
     */
    addDeviceCode(code: string): void {
        this.parameters.set(AADServerParamKeys.DEVICE_CODE, encodeURIComponent(code));
    }

    /**
     * add the `refreshToken` passed by the user
     * @param refreshToken
     */
    addRefreshToken(refreshToken: string): void {
        this.parameters.set(AADServerParamKeys.REFRESH_TOKEN, encodeURIComponent(refreshToken));
    }

    /**
     * add the `code_verifier` passed by the user to exchange for a token
     * @param codeVerifier
     */
    addCodeVerifier(codeVerifier: string): void {
        this.parameters.set(AADServerParamKeys.CODE_VERIFIER, codeVerifier);
    }

    /**
     * add client_secret
     * @param clientSecret
     */
    // TODO uncomment when confidential client flow is added.
    // addClientSecret(clientSecret: string): void {
    //     params.set(`${AADServerParamKeys.CLIENT_SECRET}`, clientSecret);
    // }

    /**
     * add grant type
     * @param grantType
     */
    addGrantType(grantType: string): void {
        this.parameters.set(AADServerParamKeys.GRANT_TYPE, encodeURIComponent(grantType));
    }

    /**
     * add client info
     *
     */
    addClientInfo(): void {
        this.parameters.set(ClientInfo, "1");
    }

    /**
     * add extraQueryParams
     * @param eQparams
     */
    addExtraQueryParameters(eQparams: StringDict) {
        RequestValidator.sanitizeEQParams(eQparams, this.parameters);
        Object.keys(eQparams).forEach((key) => {
            this.parameters.set(key, eQparams[key]);
        });
    }

    /**
     * Utility to create a URL from the params map
     */
    createQueryString(): string {
        const queryParameterArray: Array<string> = new Array<string>();

        this.parameters.forEach((value, key) => {
            queryParameterArray.push(`${key}=${value}`);
        });

        return queryParameterArray.join("&");
    }
}
