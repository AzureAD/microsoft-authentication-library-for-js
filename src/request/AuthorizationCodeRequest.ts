/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @type AuthorizationCodeRequest: Request object passed by user to retrieve a token from the server exchaging a valid authorization code (second leg of authorization code grant flow)
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
export type AuthorizationCodeRequest = {
    scopes: Array<string>;
    redirectUri: string;
    code: string;
    authority?: string;
    codeVerifier?: string;
    correlationId?: string;
};
