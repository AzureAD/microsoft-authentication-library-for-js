// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * The AuthenticationParamters type describes the
 * structure of the paramters object that is sent
 * as input to the acquireToken() method in
 * a PublicClientApplication.
 */
export type AuthenticationParameters = {
    authority?: string;
    scopes?: string[];
};
