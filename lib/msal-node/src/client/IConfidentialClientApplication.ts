/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, ClientCredentialRequest, OnBehalfOfRequest } from "@azure/msal-common";
import { NodeConfigurationAuthError } from "../error/NodeConfigurationAuthError";

export interface IConfidentialClientApplication {
    acquireTokenByClientCredential(request: ClientCredentialRequest): Promise<AuthenticationResult>;
    acquireTokenOnBehalfOf(request: OnBehalfOfRequest): Promise<AuthenticationResult>;
}

export const stubbedConfidentialClientApplication: IConfidentialClientApplication = {
    acquireTokenByClientCredential: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    },
    acquireTokenOnBehalfOf: () => {
        return Promise.reject(NodeConfigurationAuthError.createStubPcaInstanceCalledError);
    }
};

