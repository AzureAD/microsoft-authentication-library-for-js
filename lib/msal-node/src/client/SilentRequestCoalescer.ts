/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    AuthenticationResult,
    CommonSilentFlowRequest,
    Logger,
    NativeRequest,
    getRequestThumbprint,
} from "@azure/msal-common/node";

/**
 * Prepared silent requests and the acquisition path whose parameters determine their key.
 */
export type SilentRequestKeyInput =
    | {
          requestType: "non-native";
          request: CommonSilentFlowRequest;
          authority: string;
          clientId: string;
      }
    | {
          requestType: "native";
          request: NativeRequest;
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
    const authority =
        input.requestType === "native" ? request.authority : input.authority;
    const commonKeyFields = {
        requestType: input.requestType,
        clientId:
            input.requestType === "native"
                ? input.request.clientId
                : input.clientId,
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

    if (input.requestType === "native") {
        return JSON.stringify({
            ...commonKeyFields,
            accountId: input.request.accountId,
            shrNonce: input.request.shrNonce,
            extraScopesToConsent: canonicalizeRequestValues(
                input.request.extraScopesToConsent
            ),
            loginHint: input.request.loginHint,
            prompt: input.request.prompt,
        });
    }

    const nonNativeRequest = input.request;
    const thumbprint = getRequestThumbprint(
        input.clientId,
        { ...nonNativeRequest, authority },
        nonNativeRequest.account.homeAccountId
    );

    return JSON.stringify({
        ...thumbprint,
        ...commonKeyFields,
        accountTenantId: nonNativeRequest.account.tenantId,
        accountEnvironment: nonNativeRequest.account.environment,
        refreshTokenExpirationOffsetSeconds:
            nonNativeRequest.refreshTokenExpirationOffsetSeconds,
        extraQueryParameters: canonicalizeRequestValues(
            nonNativeRequest.extraQueryParameters
        ),
        skipBrokerClaims:
            thumbprint.embeddedClientId ||
            nonNativeRequest.extraParameters?.[
                AADServerParamKeys.BROKER_CLIENT_ID
            ]
                ? nonNativeRequest.skipBrokerClaims
                : undefined,
    });
}

/**
 * Copies mutable native request values so execution cannot diverge from the stored key.
 */
export function snapshotNativeRequest(request: NativeRequest): NativeRequest {
    return {
        ...request,
        scopes: [...request.scopes],
        extraParameters: request.extraParameters
            ? { ...request.extraParameters }
            : undefined,
        extraScopesToConsent: request.extraScopesToConsent
            ? [...request.extraScopesToConsent]
            : undefined,
    };
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
