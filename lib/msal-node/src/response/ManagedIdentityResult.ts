/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Result returned from the managed identity's endpoint.
 * - accessToken    - The requested access token. When called via a secured REST API, the token is embedded in the Authorization request header field as a "bearer" token, allowing the API to authenticate the caller
 * - expiresOn      - The timespan when the access token expires. The date is represented as the number of seconds from "1970-01-01T0:0:0Z UTC" (corresponds to the token's exp claim)
 * - resource       - The resource the access token was requested for. It matches the resource query string parameter of the request
 * - tokenType      - The type of token returned by the Managed Identity endpoint. It's a "Bearer" access token, which means the resource can give access to the bearer of this token
 * - clientId       - A unique identifier generated by Azure AD for the Azure Resource. The Client ID is a GUID value that uniquely identifies the application and its configuration within the identity platform
 */
export type ManagedIdentityResult = {
    accessToken: string;
    expiresOn: Date;
    resource: string;
    tokenType: string;
    clientId: string;
};
