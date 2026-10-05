/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    ScopeSet,
    getRequestThumbprint,
} from "@azure/msal-common/browser";
import type {
    AccountInfo,
    IPerformanceClient,
    Logger,
    StringDict,
} from "@azure/msal-common/browser";
import type { IPlatformAuthHandler } from "../broker/nativeBroker/IPlatformAuthHandler.js";
import { isPlatformAuthAllowed } from "../broker/nativeBroker/PlatformAuthProvider.js";
import type { PlatformAuthExtraParametersNoCache } from "../broker/nativeBroker/PlatformAuthRequest.js";
import type { BrowserConfiguration } from "../config/Configuration.js";
import { CacheLookupPolicy } from "../utils/BrowserConstants.js";
import type { SilentRequest } from "./SilentRequest.js";
import type { SsoSilentRequest } from "./SsoSilentRequest.js";

/**
 * Request context used by flow-specific silent request preparers.
 */
export type SilentRequestPreparationInput = {
    request: SilentRequest;
    account: AccountInfo;
    correlationId: string;
    config: BrowserConfiguration;
};

/**
 * Flow-independent inputs consumed by the in-flight request registry.
 */
export type PreparedSilentRequest = {
    key: string;
    request: SilentRequest;
    account: AccountInfo;
};

type PlatformSilentRequest = SilentRequest &
    Pick<SsoSilentRequest, "nonce" | "loginHint"> & {
        account: AccountInfo;
        extraParametersNoCache?: PlatformAuthExtraParametersNoCache;
        dpopNonce?: string;
    };

/**
 * Selects request preparation using the current account and broker availability.
 */
export function resolveSilentRequestPreparation(
    input: SilentRequestPreparationInput,
    platformAuthProvider: IPlatformAuthHandler | undefined,
    logger: Logger,
    performanceClient: IPerformanceClient
): PreparedSilentRequest {
    const { request, account, correlationId, config } = input;
    const prepareRequest =
        account.nativeAccountId &&
        config.system.allowPlatformBroker &&
        platformAuthProvider &&
        isPlatformAuthAllowed(
            config,
            logger,
            correlationId,
            platformAuthProvider,
            request.authenticationScheme,
            performanceClient
        )
            ? preparePlatformSilentRequest
            : prepareWebSilentRequest;

    return prepareRequest(input);
}

/**
 * Preserves the standard web thumbprint and caller-owned request references.
 */
export function prepareWebSilentRequest({
    request,
    account,
    correlationId,
    config,
}: SilentRequestPreparationInput): PreparedSilentRequest {
    const thumbprint = getRequestThumbprint(
        config.auth.clientId,
        {
            ...request,
            authority: request.authority || config.auth.authority,
            correlationId: correlationId,
        },
        account.homeAccountId
    );

    return {
        key: JSON.stringify(thumbprint),
        request,
        account,
    };
}

/**
 * Snapshots broker inputs and creates the extended key before acquisition begins.
 */
export function preparePlatformSilentRequest({
    request,
    account,
    config,
}: SilentRequestPreparationInput): PreparedSilentRequest {
    const platformRequest = snapshotPlatformSilentRequest({
        ...request,
        account,
    });

    return {
        key: `platform:${getPlatformSilentRequestKey(platformRequest, config)}`,
        request: platformRequest,
        account: platformRequest.account,
    };
}

/**
 * Extends the common thumbprint with broker and client-side silent-flow inputs.
 * Scopes are normalized like the broker request, without folding their casing.
 */
function getPlatformSilentRequestKey(
    request: PlatformSilentRequest,
    config: BrowserConfiguration
): string {
    const thumbprint = getRequestThumbprint(
        config.auth.clientId,
        {
            ...request,
            authority: request.authority || config.auth.authority,
            correlationId: request.correlationId || "",
            scopes: new ScopeSet(
                [...(request.scopes || []), ...Constants.OIDC_DEFAULT_SCOPES],
                request.correlationId || ""
            )
                .asArray()
                .sort(),
        },
        request.account.homeAccountId
    );

    return JSON.stringify({
        ...thumbprint,
        accountId: request.account.nativeAccountId,
        accountTenantId: request.account.tenantId,
        accountEnvironment: request.account.environment,
        azureCloudInstance: request.azureCloudOptions?.azureCloudInstance,
        cloudTenantId: request.azureCloudOptions?.tenant,
        redirectUri: request.redirectUri || config.auth.redirectUri,
        nonce: request.nonce,
        prompt: request.prompt,
        state: request.state,
        loginHint: request.loginHint,
        popKid: request.popKid,
        shrNonce: request.shrNonce,
        dpopNonce: request.dpopNonce,
        skipBrokerClaims: request.embeddedClientId
            ? !!request.skipBrokerClaims
            : undefined,
        extraParameters: canonicalizeStringDict(request.extraParameters),
        extraQueryParameters: canonicalizeStringDict(
            request.extraQueryParameters
        ),
        extraParametersNoCache: canonicalizeStringDict(
            request.extraParametersNoCache
        ),
        forceRefresh: !!request.forceRefresh,
        cacheLookupPolicy:
            request.cacheLookupPolicy ?? CacheLookupPolicy.Default,
        storeAccessToken: request.storeInCache?.accessToken !== false,
        storeIdToken: request.storeInCache?.idToken !== false,
        storeRefreshToken: request.storeInCache?.refreshToken !== false,
    });
}

/**
 * Copies caller-owned mutable inputs before asynchronous broker initialization.
 */
function snapshotPlatformSilentRequest(
    request: PlatformSilentRequest
): PlatformSilentRequest {
    return {
        ...request,
        scopes: [...(request.scopes || [])],
        account: { ...request.account },
        azureCloudOptions: request.azureCloudOptions
            ? { ...request.azureCloudOptions }
            : undefined,
        extraParameters: request.extraParameters
            ? { ...request.extraParameters }
            : undefined,
        extraQueryParameters: request.extraQueryParameters
            ? { ...request.extraQueryParameters }
            : undefined,
        extraParametersNoCache: request.extraParametersNoCache
            ? { ...request.extraParametersNoCache }
            : undefined,
        attributeTokens: request.attributeTokens
            ? [...request.attributeTokens]
            : undefined,
        storeInCache: request.storeInCache
            ? { ...request.storeInCache }
            : undefined,
    };
}

/**
 * Canonicalizes dictionary ordering while preserving exact parameter values.
 */
function canonicalizeStringDict(
    values: StringDict = {}
): Array<[string, string]> {
    return Object.keys(values)
        .sort()
        .map((key): [string, string] => [key, values[key]]);
}
