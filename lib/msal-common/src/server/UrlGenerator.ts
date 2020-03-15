/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AADServerParamKeys, SSOTypes } from "./../utils/Constants";
import { AuthorizationCodeUrlParameters } from "./../request/AuthorizationCodeUrlParameters";
import { Constants } from "./../utils/Constants";
import { ScopeSet } from "./../request/ScopeSet";
import { Authority } from "./../authority/Authority";

export class UrlGenerator {

    // params specific to Authorization Code Url
    static authorizationCodeUrlBuilder (
        params: Map<string, string>,
        request: AuthorizationCodeUrlParameters
    ): void {
        // Authorization Code URL Params
        params.set(
            `${AADServerParamKeys.RESPONSE_TYPE}`,
            encodeURIComponent(Constants.CODE_RESPONSE_TYPE)
        );
        params.set(
            `${AADServerParamKeys.RESPONSE_MODE}`,
            encodeURIComponent(Constants.FRAGMENT_RESPONSE_MODE)
        );

        if (request.codeChallenge && request.codeChallengeMethod) {
            params.set(
                `${AADServerParamKeys.CODE_CHALLENGE}`,
                encodeURIComponent(request.codeChallenge)
            );
            params.set(
                `${AADServerParamKeys.CODE_CHALLENGE_METHOD}`,
                encodeURIComponent(request.codeChallengeMethod)
            );
        }
    }

    // Scopes
    static addScopes(params: Map<string, string>, scopes: Array<string>) {
        params.set(
            `${AADServerParamKeys.SCOPE}`,
            encodeURIComponent(ScopeSet.finalScopes(scopes))
        );
    }

    // clientId
    static addClientId(params: Map<string, string>, clientId: string) {
        params.set(
            `${AADServerParamKeys.CLIENT_ID}`,
            encodeURIComponent(clientId)
        );
    }

    // redirectUri
    static addRedirectUri(params: Map<string, string>, redirectUri: string) {
        params.set(
            `${AADServerParamKeys.REDIRECT_URI}`,
            encodeURIComponent(redirectUri)
        );
    }

    // domainHint
    static addDomainHint(params: Map<string, string>, domainHint: string) {
        params.set(`${SSOTypes.DOMAIN_HINT}`, encodeURIComponent(domainHint));
    }

    // loginHint
    static addLoginHint(params: Map<string, string>, loginHint: string) {
        params.set(`${SSOTypes.LOGIN_HINT}`, encodeURIComponent(loginHint));
    }

    // loginHint
    static addCorrelationId(
        params: Map<string, string>,
        correlationId: string
    ) {
        params.set(
            `${AADServerParamKeys.CLIENT_REQUEST_ID}`,
            encodeURIComponent(correlationId)
        );
    }

    // prompt
    static addPrompt(params: Map<string, string>, prompt: string) {
        params.set(`${AADServerParamKeys.PROMPT}`, encodeURIComponent(prompt));
    }

    // state
    static addState(params: Map<string, string>, state: string) {
        params.set(`${AADServerParamKeys.STATE}`, encodeURIComponent(state));
    }

    // nonce
    static addNonce(params: Map<string, string>, nonce: string) {
        params.set(`${AADServerParamKeys.NONCE}`, encodeURIComponent(nonce));
    }

    // addLibraryData
    static addLibrarydata(headers: Map<string, string>) {
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
     *
     * @param paramsMap
     * @param authority
     */
    static createUrl(
        paramsMap: Map<String, String>,
        authority: Authority
    ): string {
        let queryString: string;
        let authEndpoint: string = authority.authorizationEndpoint;

        // if the endpoint already has queryparams, lets add to it, otherwise add the first one
        if (authEndpoint.indexOf("?") < 0) {
            authEndpoint += "?";
        }

        // generate a Query string from a map
        paramsMap.forEach((value, key) => {
            if (queryString) {
                queryString += `&${key}=${value}`;
            } else {
                queryString = `${key}=${value}`;
            }
        });

        return authEndpoint + queryString;
    }
}
