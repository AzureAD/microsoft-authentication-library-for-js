/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as AADServerParamKeys from "../common/constants/AADServerParamKeys.js";
import { Logger } from "../common/logger/Logger.js";
import { getRequestThumbprint } from "../common/network/RequestThumbprint.js";
import { CommonSilentFlowRequest } from "../common/request/CommonSilentFlowRequest.js";
import { AuthenticationResult } from "../common/response/AuthenticationResult.js";

/**
 * Prepared silent requests and the acquisition path whose parameters determine their key.
 */
export type SilentRequestKeyInput = {
    requestType: "non-native";
    request: CommonSilentFlowRequest;
    authority: string;
    clientId: string;
};

const activeSilentTokenRequests = new WeakMap<
    object,
    Map<string, Promise<AuthenticationResult>>
>();

/**
 * Shares an in-flight silent acquisition while preserving each caller's correlation ID.
 */
export function acquireTokenSilentDeduped(
    owner: object,
    logger: Logger,
    silentRequestKey: string,
    correlationId: string,
    acquireToken: () => Promise<AuthenticationResult>
): Promise<AuthenticationResult> {
    const existingRequests = activeSilentTokenRequests.get(owner);
    const activeRequests =
        existingRequests || new Map<string, Promise<AuthenticationResult>>();
    if (!existingRequests) {
        activeSilentTokenRequests.set(owner, activeRequests);
    }

    const inProgressRequest = activeRequests.get(silentRequestKey);
    if (inProgressRequest) {
        logger.verbose(
            "acquireTokenSilent has been called previously, returning the result from the first call",
            correlationId
        );
        return applyCallerCorrelationIdToResult(
            inProgressRequest,
            correlationId
        );
    }

    logger.verbose(
        "acquireTokenSilent called for the first time, storing active request",
        correlationId
    );
    const activeRequest = Promise.resolve()
        .then(acquireToken)
        .finally(() => {
            activeRequests.delete(silentRequestKey);
            if (activeRequests.size === 0) {
                activeSilentTokenRequests.delete(owner);
            }
        });
    activeRequests.set(silentRequestKey, activeRequest);

    return applyCallerCorrelationIdToResult(activeRequest, correlationId);
}

/**
 * Builds the key used to identify equivalent in-progress silent requests.
 */
export function getSilentRequestKey(input: SilentRequestKeyInput): string {
    const { request } = input;
    const authority = input.authority;
    const commonKeyFields = {
        requestType: input.requestType,
        clientId: input.clientId,
        authority,
        scopes: canonicalizeRequestValues(request.scopes),
        claims: request.claims,
        authenticationScheme: request.authenticationScheme,
        resourceRequestMethod: request.resourceRequestMethod,
        resourceRequestUri: request.resourceRequestUri,
        forceRefresh: request.forceRefresh,
        redirectUri: request.redirectUri || "",
        resource: request.resource,
        extraParameters: canonicalizeRequestValues(request.extraParameters),
    };

    const thumbprint = getRequestThumbprint(
        input.clientId,
        { ...request, authority },
        request.account.homeAccountId
    );

    return JSON.stringify({
        ...thumbprint,
        ...commonKeyFields,
        accountTenantId: request.account.tenantId,
        accountEnvironment: request.account.environment,
        refreshTokenExpirationOffsetSeconds:
            request.refreshTokenExpirationOffsetSeconds,
        extraQueryParameters: canonicalizeRequestValues(
            request.extraQueryParameters
        ),
        skipBrokerClaims:
            thumbprint.embeddedClientId ||
            request.extraParameters?.[AADServerParamKeys.BROKER_CLIENT_ID]
                ? request.skipBrokerClaims
                : undefined,
    });
}

/**
 * Canonicalizes scope sets and request dictionaries without changing the outgoing request.
 */
function canonicalizeRequestValues(
    values?: Record<string, string> | Array<string>
): Array<[string, string]> | Array<string> | undefined {
    if (Array.isArray(values)) {
        return Array.from(
            new Set(
                values
                    .map((scope) => scope.trim())
                    .filter((scope) => scope.length > 0)
            )
        ).sort();
    }

    return values
        ? Object.keys(values)
              .sort()
              .map((key): [string, string] => [key, values[key]])
        : undefined;
}

/**
 * Applies the caller's correlation ID to successful results.
 * Shared failures retain the original error and underlying operation correlation ID.
 */
function applyCallerCorrelationIdToResult(
    activeRequest: Promise<AuthenticationResult>,
    correlationId: string
): Promise<AuthenticationResult> {
    return activeRequest.then((result) => ({
        ...result,
        correlationId,
    }));
}
