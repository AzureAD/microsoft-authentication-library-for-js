/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AADServerParamKeys, SSOTypes } from "../utils/Constants";
import { Constants, HeaderNames } from "../utils/Constants";
import { ScopeSet } from "../request/ScopeSet";
import { Authority } from "../authority/Authority";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

export class ServerParamsGenerator {

    /**
     * add response_type = code
     * @param params
     */
    static addResponseTypeCode(params: Map<string, string>): void {
        params.set(
            `${AADServerParamKeys.RESPONSE_TYPE}`,
            encodeURIComponent(Constants.CODE_RESPONSE_TYPE)
        );
    }

    /**
     * add response_mode = fragment (currently hardcoded, have a future option to pass 'query' if the user chooses to)
     * @param params
     */
    static addResponseMode(params: Map<string, string>, responseMode?: string): void {
        params.set(
            `${AADServerParamKeys.RESPONSE_MODE}`,
            encodeURIComponent(Constants.QUERY_RESPONSE_MODE)
        );
    }

    /**
     * add scopes
     * @param params
     * @param scopes
     */
    static addScopes(params: Map<string, string>, scopes: Array<string>): void {
        params.set(
            `${AADServerParamKeys.SCOPE}`,
            encodeURIComponent(ScopeSet.finalScopes(scopes))
        );
    }

    /**
     * add clientId
     * @param params
     * @param clientId
     */
    static addClientId(params: Map<string, string>, clientId: string): void {
        params.set(
            `${AADServerParamKeys.CLIENT_ID}`,
            encodeURIComponent(clientId)
        );
    }

    /**
     * add redirect_uri
     * @param params
     * @param redirectUri
     */
    static addRedirectUri(params: Map<string, string>, redirectUri: string): void {
        params.set(
            `${AADServerParamKeys.REDIRECT_URI}`,
            encodeURIComponent(redirectUri)
        );
    }

    /**
     * add domain_hint
     * @param params
     * @param domainHint
     */
    static addDomainHint(params: Map<string, string>, domainHint: string): void {
        params.set(`${SSOTypes.DOMAIN_HINT}`, encodeURIComponent(domainHint));
    }

    /**
     * add login_hint
     * @param params
     * @param loginHint
     */
    static addLoginHint(params: Map<string, string>, loginHint: string): void {
        params.set(`${SSOTypes.LOGIN_HINT}`, encodeURIComponent(loginHint));
    }

    /**
     * add correlationId
     * @param params
     * @param correlationId
     */
    static addCorrelationId(
        params: Map<string, string>,
        correlationId: string
    ): void {
        params.set(
            `${AADServerParamKeys.CLIENT_REQUEST_ID}`,
            encodeURIComponent(correlationId)
        );
    }

    /**
     * add prompt
     * @param params
     * @param prompt
     */
    static addPrompt(params: Map<string, string>, prompt: string): void {
        params.set(`${AADServerParamKeys.PROMPT}`, encodeURIComponent(prompt));
    }

    /**
     * add state
     * @param params
     * @param state
     */
    static addState(params: Map<string, string>, state: string): void {
        params.set(`${AADServerParamKeys.STATE}`, encodeURIComponent(state));
    }

    /**
     * add nonce
     * @param params
     * @param nonce
     */
    static addNonce(params: Map<string, string>, nonce: string): void {
        params.set(`${AADServerParamKeys.NONCE}`, encodeURIComponent(nonce));
    }

    /**
     * add code_challenge and code_challenge_method
     * - throw if either of them are not passed
     * @param params
     * @param codeChallenge
     * @param codeChallengeMethod
     */
    static addCodeChallengeParams(
        params: Map<string, string>,
        codeChallenge: string,
        codeChallengeMethod: string
    ): void {
        if (codeChallenge && codeChallengeMethod) {
            params.set(
                `${AADServerParamKeys.CODE_CHALLENGE}`,
                encodeURIComponent(codeChallenge)
            );
            params.set(
                `${AADServerParamKeys.CODE_CHALLENGE_METHOD}`,
                encodeURIComponent(codeChallengeMethod)
            );
        } else {
            throw ClientConfigurationError.createInvalidCodeChallengeParams();
        }
    }

    /**
     * add the `authorization_code` passed by the user to exchange for a token
     * @param params
     * @param code
     */
    static addAuthorizationCode(params: Map<string, string>, code: string): void {
        params.set(`${AADServerParamKeys.CODE}`, encodeURIComponent(code));
    }

    /**
     * add the `authorization_code` passed by the user to exchange for a token
     * @param params
     * @param code
     */
    static addDeviceCode(params: Map<string, string>, code: string): void {
        params.set(`${AADServerParamKeys.DEVICE_CODE}`, encodeURIComponent(code));
    }

    /**
     * add the `code_verifier` passed by the user to exchange for a token
     * @param params
     * @param codeVerifier
     */
    static addCodeVerifier(params: Map<string, string>, codeVerifier: string): void {
        params.set(`${AADServerParamKeys.CODE_VERIFIER}`, codeVerifier);
    }

    /**
     * add client_secret
     * @param params
     * @param clientSecret
     */
    static addClientSecret(params: Map<string, string>, clientSecret: string): void {
        params.set(`${AADServerParamKeys.CLIENT_SECRET}`, clientSecret);
    }

    static addGrantType(params: Map<string, string>, grantType: string): void {
        params.set(`${AADServerParamKeys.GRANT_TYPE}`, encodeURIComponent(grantType));
    }

    /**
     * add "ContentType:" header
     * @param headers
     */
    static addContentTypeHeader(headers: Map<string, string>): void {
        headers.set(HeaderNames.CONTENT_TYPE, Constants.URL_FORM_CONTENT_TYPE);
    }

    /**
     * addLibraryData
     * @param headers
     */
    static addLibrarydataHeaders(headers: Map<string, string>): void {
        // library version
        headers.set(
            `${AADServerParamKeys.X_CLIENT_SKU}`,
            encodeURIComponent(Constants.LIBRARY_NAME)
        );
        headers.set(
            `${AADServerParamKeys.X_CLIENT_VER}`,
            encodeURIComponent("0.0.1")
        );
    }

    /**
     * Utility to create a URL from the params map
     * @param paramsMap
     * @param authority
     */
    static createQueryString(paramsMap: Map<string, string>): string {
        let queryParameterArray: Array<string> = new Array<string>();

        paramsMap.forEach((value, key) => {
            let keyValuePair = key + "=" + value;
            queryParameterArray.push(keyValuePair);
        });

        return queryParameterArray.join("&");
    }
}
