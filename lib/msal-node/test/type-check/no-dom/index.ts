/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ConfidentialClientApplication,
    ManagedIdentityApplication,
    TokenCache,
    DistributedCachePlugin,
    CryptoProvider,
    PromptValue,
    ResponseMode,
    type IConfidentialClientApplication,
    type ITokenCache,
    type AuthorizationCodeRequest,
    type AuthorizationUrlRequest,
    type ClientCredentialRequest,
    type OnBehalfOfRequest,
    type UserFederatedIdentityCredentialRequest,
    type UsernamePasswordRequest,
    type RefreshTokenRequest,
    type SilentFlowRequest,
    type ManagedIdentityRequestParams,
} from "@azure/msal-node";

declare const confidentialClient: ConfidentialClientApplication;
declare const confidentialClientInterface: IConfidentialClientApplication;
declare const managedIdentityClient: ManagedIdentityApplication;

void ConfidentialClientApplication;
void ManagedIdentityApplication;
void TokenCache;
void DistributedCachePlugin;
void CryptoProvider;
void PromptValue;
void ResponseMode;

void confidentialClient.getAuthCodeUrl;
void confidentialClient.acquireTokenByCode;
void confidentialClient.acquireTokenSilent;
void confidentialClient.acquireTokenByRefreshToken;
void confidentialClient.acquireTokenByUsernamePassword;
void confidentialClient.acquireTokenByClientCredential;
void confidentialClient.acquireTokenOnBehalfOf;
void confidentialClient.acquireTokenByUserFederatedIdentityCredential;
void confidentialClient.getTokenCache;
void confidentialClient.clearCache;
void confidentialClient.getLogger;
void confidentialClient.setLogger;
void confidentialClient.SetAppTokenProvider;
void confidentialClientInterface;

void managedIdentityClient.acquireToken;
void managedIdentityClient.getManagedIdentitySource;

type RetainedRequestTypes =
    | AuthorizationCodeRequest
    | AuthorizationUrlRequest
    | ClientCredentialRequest
    | OnBehalfOfRequest
    | UserFederatedIdentityCredentialRequest
    | UsernamePasswordRequest
    | RefreshTokenRequest
    | SilentFlowRequest
    | ManagedIdentityRequestParams;

type RetainedCacheTypes = ITokenCache;

declare const retainedRequest: RetainedRequestTypes;
declare const retainedCache: RetainedCacheTypes;
void retainedRequest;
void retainedCache;

// @ts-expect-error Public clients are not part of the next major package.
import { PublicClientApplication } from "@azure/msal-node";
// @ts-expect-error Public client interfaces are not part of the next major package.
import { IPublicClientApplication } from "@azure/msal-node";
// @ts-expect-error Device code requests are not part of the next major package.
import { DeviceCodeRequest } from "@azure/msal-node";
// @ts-expect-error Interactive requests are not part of the next major package.
import { InteractiveRequest } from "@azure/msal-node";
// @ts-expect-error Public client sign-out requests are not part of the next major package.
import { SignOutRequest } from "@azure/msal-node";
// @ts-expect-error Native broker configuration is not part of the next major package.
import { BrokerOptions } from "@azure/msal-node";
// @ts-expect-error Native broker plugins are not part of the next major package.
import { INativeBrokerPlugin } from "@azure/msal-node";

class ExistingSubclassMembers extends ConfidentialClientApplication {
    private activeSilentTokenRequests = new Map();
    private acquireTokenSilentDeduped = (): void => {};
    private getSilentRequestKey = (): string => "";
}

void PublicClientApplication;
void IPublicClientApplication;
void DeviceCodeRequest;
void InteractiveRequest;
void SignOutRequest;
void BrokerOptions;
void INativeBrokerPlugin;
void ExistingSubclassMembers;
