/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type ValidationOptions = {
    audience: string,
    issuer: string,
}

export type State = {
    nonce: string,
    stage: string
}

export type Resource = {
    callingPageRoute: string,
    endpoint: string,
    scopes: string[]
}

export type Credentials = {
    clientId: string,
    tenantId: string,
    clientSecret: string
}

export type Settings = {
    homePageRoute: string,
    redirectUri: string,
    postLogoutRedirectUri: string
}

export type AppSettings = {
    credentials: Credentials,
    settings: Settings,
    resources: {
        [resource:string]: Resource
    },
    policies: any,
    protected: any,
}

export type UserInfo = {
    businessPhones?: Array<string>,
    displayName?: string,
    givenName?: string,
    id?: string,
    jobTitle?: string,
    mail?: string,
    mobilePhone?: string,
    officeLocation?: string,
    preferredLanguage?: string,
    surname?: string,
    userPrincipalName?: string
};