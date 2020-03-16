/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationClientConfiguration } from "../config/AuthorizationClientConfiguration";
import { RequestValidator } from "./RequestValidator";
import { ServerParamsGenerator } from "../server/ServerParamsGenerator";
import { GrantType } from "../utils/Constants";

/**
 * @type AuthorizationCodeParameters: Request object passed by user to retrieve a token from the server exchaging a valid authorization code (second leg of authorization code grant flow)
 *
 * scopes:                  A space-separated list of scopes. For OpenID Connect, it must include the scope openid,
 *                          which translates to the "Sign you in" permission in the consent UI.
 *                          You might also include other scopes in this request for requesting consent.
 *
 * authority:               authorization endpoint that grants the code to the application
 *
 * redirectUri:             The redirect URI of your app, where authentication responses can be sent and received by your app.
 *                          It must exactly match one of the redirect URIs you registered in the portal,
 *                          except that it must be URL encoded. If not present, the endpoint will pick one registered
 *                          redirect_uri at random to send the user back to.
 *
 * code:                    The authorization_code that the user acquired in the first leg of the flow.
 *
 * codeVerifier:            The same code_verifier that was used to obtain the authorization_code.
 *                          Required if PKCE was used in the authorization code grant request.
 *                          For more information, see the PKCE RFC: https://tools.ietf.org/html/rfc7636
 *
 * clientSecret:            The application secret that you created in the app registration portal for your app.
 *                          You shouldn't use the application secret in a native app because client_secrets can't be reliably stored on devices.
 *                          It's required for web apps and web APIs, which have the ability to store the client_secret
 *                          securely on the server side. The client secret must be URL-encoded before being sent.
 *                          For more information please check: https://tools.ietf.org/html/rfc3986#page-12.
 *
 * correlationId:           Unique GUID set per request to trace a request end-to-end for telemetry purposes
 *
 * This "Request" parameter is called when `msal-node` makes the authorization code request to the service on behalf of the app
 */
export class AuthorizationCodeParameters {
    scopes: Array<string>;
    authority: string;
    redirectUri: string;
    code: string;
    codeVerifier?: string;
    clientSecret?: string;
    correlationId?: string;

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     * @param config
     */
    static generateAuthCodeParams(
        request: AuthorizationCodeParameters,
        config: AuthorizationClientConfiguration
    ) {
        const paramsMap: Map<string, string> = new Map<string, string>();

        // add clientId
        ServerParamsGenerator.addClientId(paramsMap, config.auth.clientId);

        // validate and add scopes
        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            config.auth.clientId
        );
        ServerParamsGenerator.addScopes(paramsMap, scopes);

        // validate the redirectUri (to be a non null value)
        RequestValidator.validateRedirectUri(request.redirectUri);
        ServerParamsGenerator.addRedirectUri(paramsMap, request.redirectUri);

        // add code: user set, not validated
        ServerParamsGenerator.addAuthorizationCode(paramsMap, request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            ServerParamsGenerator.addCodeVerifier(paramsMap, request.codeVerifier);
        }

        // add client_secret (needed for web apps)
        if (request.clientSecret) {
            ServerParamsGenerator.addClientSecret(paramsMap, request.clientSecret);
        }

        // add grant_type = authorization_code
        ServerParamsGenerator.addGrantType(paramsMap, GrantType.AUTHORIZATION_CODE_GRANT);

        return paramsMap;
    }
}
