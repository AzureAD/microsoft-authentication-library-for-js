/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../error/ClientConfigurationError.js";
import { BROKER_CLIENT_ID } from "../constants/AADServerParamKeys.js";
import type { BaseAuthRequest } from "./BaseAuthRequest.js";

/** Matches the broker-parameter presence used by the outgoing claims builder. */
export function shouldSkipBrokerClaims(
    request: Pick<
        BaseAuthRequest,
        "skipBrokerClaims" | "embeddedClientId" | "extraParameters"
    >
): boolean {
    return !!(
        request.skipBrokerClaims &&
        (request.embeddedClientId ||
            request.extraParameters?.[BROKER_CLIENT_ID])
    );
}

/** Parses claims without including their potentially sensitive contents in errors. */
export function parseClaims(
    claims: string,
    correlationId: string = ""
): Record<string, unknown> {
    let parsed: unknown;
    try {
        parsed = JSON.parse(claims);
    } catch {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidClaims,
            correlationId
        );
    }
    if (!isPlainObject(parsed)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidClaims,
            correlationId
        );
    }
    return parsed;
}

/** Narrows JSON objects for claims processing. */
export function isPlainObject(
    value: unknown
): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Applies configured capabilities before both cache lookup and token acquisition. */
export function mergeClientCapabilities(
    claims: string,
    clientCapabilities?: string[],
    correlationId?: string,
    claimsToMerge?: string
): string;
export function mergeClientCapabilities(
    claims?: string,
    clientCapabilities?: string[],
    correlationId?: string,
    claimsToMerge?: string
): string | undefined;
export function mergeClientCapabilities(
    claims?: string,
    clientCapabilities?: string[],
    correlationId: string = "",
    claimsToMerge?: string
): string | undefined {
    if (!clientCapabilities?.length && !claimsToMerge?.trim()) {
        return claims;
    }
    let parsed = claims ? parseClaims(claims, correlationId) : {};
    if (claimsToMerge?.trim()) {
        parsed = deepMergeClaims(
            parsed,
            parseClaims(claimsToMerge, correlationId)
        );
    }
    if (!clientCapabilities?.length) {
        return JSON.stringify(parsed);
    }
    const access = parsed.access_token;
    const capability = isPlainObject(access) ? access.xms_cc : undefined;
    if (
        (access !== undefined && !isPlainObject(access)) ||
        (capability !== undefined && !isPlainObject(capability)) ||
        (isPlainObject(capability) &&
            capability.values !== undefined &&
            (!Array.isArray(capability.values) ||
                capability.values.some((value) => typeof value !== "string")))
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidClaims,
            correlationId
        );
    }
    return JSON.stringify({
        ...parsed,
        access_token: {
            ...(isPlainObject(access) ? access : {}),
            xms_cc: {
                ...(isPlainObject(capability) ? capability : {}),
                values: clientCapabilities,
            },
        },
    });
}

/** Merges client-originated claims with precedence on conflicting fields. */
export function deepMergeClaims(
    baseClaims: Record<string, unknown>,
    claimsToMerge: Record<string, unknown>
): Record<string, unknown> {
    const merged = { ...baseClaims };
    for (const [key, value] of Object.entries(claimsToMerge)) {
        const baseValue = merged[key];
        merged[key] =
            isPlainObject(baseValue) && isPlainObject(value)
                ? deepMergeClaims(baseValue, value)
                : value;
    }
    return merged;
}

/** Whether the outgoing claims declare CAE support. */
export function supportsCae(
    claims?: string,
    correlationId: string = ""
): boolean {
    const parsed = claims ? parseClaims(claims, correlationId) : {};
    const access = parsed.access_token;
    const capability = isPlainObject(access) ? access.xms_cc : undefined;
    const values = isPlainObject(capability) ? capability.values : undefined;
    return (
        Array.isArray(values) &&
        values.some(
            (value) =>
                typeof value === "string" && value.toUpperCase() === "CP1"
        )
    );
}

/** Capability declarations alone do not request a new token. */
export function hasClaimsChallenge(
    claims?: string,
    correlationId: string = ""
): boolean {
    if (!claims?.trim()) {
        return false;
    }
    const parsed = parseClaims(claims, correlationId);
    return Object.entries(parsed).some(([section, contents]) => {
        if (!isPlainObject(contents)) {
            return true;
        }
        return Object.entries(contents).some(([key, value]) => {
            if (
                section !== "access_token" ||
                key !== "xms_cc" ||
                !isPlainObject(value)
            ) {
                return true;
            }
            return (
                Object.keys(value).some((field) => field !== "values") ||
                !Array.isArray(value.values) ||
                value.values.some(
                    (capability) => typeof capability !== "string"
                )
            );
        });
    });
}
