/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BaseAuthRequest,
    Constants,
    ProtocolMode,
    RequestParameterBuilder,
} from "@azure/msal-common/browser";
import type { BrowserConfiguration } from "../config/Configuration.js";
import {
    BrowserConfigurationAuthError,
    BrowserConfigurationAuthErrorCodes,
} from "../error/BrowserConfigurationAuthError.js";
import { BrowserCacheLocation } from "../utils/BrowserConstants.js";

/**
 * Rejects paths outside the local experiment instead of implying support.
 */
export function rejectCaeCacheExperiment(correlationId: string): never {
    throw new BrowserConfigurationAuthError(
        BrowserConfigurationAuthErrorCodes.experimentalCaeCacheUnsupported,
        correlationId,
        "The unpublished CAE cache experiment supports only non-brokered AAD/EAR Bearer requests in MSAL storage, without hybrid-code acquisition, hydration, attribute tokens, resource overrides or extra parameters."
    );
}

/** Rejects unsupported configurations before any acquisition can route to a broker. */
export function validateCaeCacheConfiguration(
    config: BrowserConfiguration
): void {
    if (
        config.experimental?.enableCaeCachePartitioning &&
        (![
            BrowserCacheLocation.MemoryStorage,
            BrowserCacheLocation.SessionStorage,
            BrowserCacheLocation.LocalStorage,
        ].some((location) => location === config.cache.cacheLocation) ||
            (config.system.protocolMode !== ProtocolMode.AAD &&
                config.system.protocolMode !== ProtocolMode.EAR) ||
            config.system.allowPlatformBroker ||
            config.experimental.allowPlatformBrokerWithDOM ||
            config.auth.isMcp)
    ) {
        rejectCaeCacheExperiment("");
    }
}

/**
 * Resolves the capability actually sent to the token endpoint.
 * Configured client capabilities take precedence over request xms_cc.
 */
export function prepareCaeCacheRequest<T extends Partial<BaseAuthRequest>>(
    request: T,
    config: BrowserConfiguration
): T {
    if (!config.experimental?.enableCaeCachePartitioning) {
        return request.experimentalCaeCache
            ? { ...request, experimentalCaeCache: undefined }
            : request;
    }

    const correlationId = request.correlationId || "";
    validateCaeCacheConfiguration(config);
    if (
        (request.authenticationScheme &&
            request.authenticationScheme !==
                Constants.AuthenticationScheme.BEARER) ||
        request.embeddedClientId ||
        request.skipBrokerClaims ||
        request.resource ||
        request.attributeTokens?.length ||
        Object.keys(request.extraParameters || {}).length ||
        Object.keys(request.extraQueryParameters || {}).length
    ) {
        rejectCaeCacheExperiment(correlationId);
    }

    const merged: unknown = JSON.parse(
        RequestParameterBuilder.buildMergedClaims(
            request.claims,
            config.auth.clientCapabilities,
            correlationId
        )
    );
    const access = isRecord(merged) ? merged.access_token : undefined;
    const xmsCc = isRecord(access) ? access.xms_cc : undefined;
    const values = isRecord(xmsCc) ? xmsCc.values : undefined;
    if (
        (xmsCc !== undefined && !isRecord(xmsCc)) ||
        (values !== undefined &&
            (!Array.isArray(values) ||
                !values.every((value) => value === "CP1" || value === "cp1")))
    ) {
        rejectCaeCacheExperiment(correlationId);
    }

    // The existing builder above validates the raw claims before this read.
    const raw: unknown = request.claims ? JSON.parse(request.claims) : {};
    const resources = new Set(
        (request.scopes || [])
            .map((scope) => scope.trim().toLowerCase())
            .filter(
                (scope) =>
                    !["openid", "profile", "offline_access", "email"].includes(
                        scope
                    )
            )
            .map((scope) => {
                const resource = scope.includes("/")
                    ? scope.slice(0, scope.lastIndexOf("/"))
                    : "";
                // Unqualified scopes are the documented Microsoft Graph shorthand.
                return resource === "https://graph.microsoft.com"
                    ? ""
                    : resource;
            })
    );
    if (resources.size > 1) {
        rejectCaeCacheExperiment(correlationId);
    }
    const hasChallenge =
        isRecord(raw) &&
        Object.entries(raw).some(([section, contents]) => {
            if (!isRecord(contents)) {
                return true;
            }
            if (section !== "access_token") {
                return Object.keys(contents).length > 0;
            }
            return Object.entries(contents).some(
                ([claim, value]) =>
                    claim !== "xms_cc" ||
                    !isRecord(value) ||
                    Object.keys(value).some((key) => key !== "values")
            );
        });

    return {
        ...request,
        authority: request.authority || config.auth.authority,
        scopes: request.scopes ? [...request.scopes] : undefined,
        storeInCache: request.storeInCache
            ? { ...request.storeInCache }
            : undefined,
        experimentalCaeCache: {
            epoch: request.experimentalCaeCache?.epoch,
            authorizationEpoch:
                request.experimentalCaeCache?.authorizationEpoch,
            realm: request.experimentalCaeCache?.realm,
            resource: resources.values().next().value || "",
            capability:
                Array.isArray(values) && values.length ? "cp1" : "ordinary",
            hasChallenge,
        },
    };
}

/** Narrows parsed claims without accepting arrays or null as objects. */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
