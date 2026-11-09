/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthErrorCodes,
    Constants,
    IPerformanceClient,
    createAuthError,
} from "@azure/msal-common/browser";
import {
    PlatformAuthRequest,
    PlatformAuthTokenType,
} from "./PlatformAuthRequest.js";
import {
    BrokerDpopFailureReason,
    BrokerDpopOutcome,
    PlatformAuthResponse,
} from "./PlatformAuthResponse.js";

/**
 * Returns whether a token type uses the platform broker DPoP protocol.
 */
export function isDpopBrokerTokenType(tokenType: unknown): boolean {
    const normalized =
        typeof tokenType === "string" ? tokenType.trim().toLowerCase() : "";
    return (
        normalized === PlatformAuthTokenType.DPOP_WITH_PROOF ||
        normalized === Constants.AuthenticationScheme.DPOP.toLowerCase()
    );
}

/**
 * Validates canonical broker properties before any token or account mutation.
 * Both transports must normalize their wire responses before calling this.
 */
export function validateDpopBrokerOutcome(
    response: PlatformAuthResponse,
    request: PlatformAuthRequest,
    correlationId: string,
    performanceClient: IPerformanceClient
): BrokerDpopOutcome {
    const fail = (
        failureReason: BrokerDpopFailureReason,
        message: string
    ): never => {
        performanceClient.addFields(
            {
                "ext.brokerDpopOutcome": "invalid_response",
                "ext.brokerDpopFailureReason": failureReason,
            },
            correlationId
        );
        throw createAuthError(
            AuthErrorCodes.unexpectedError,
            correlationId,
            message
        );
    };

    const properties = response.properties;
    const tokenType =
        typeof properties?.token_type === "string"
            ? properties.token_type.trim().toLowerCase()
            : undefined;
    const proof = properties?.DPoP;
    const rawAttestation = properties?.binding_attested;
    const attestation =
        typeof rawAttestation === "string"
            ? rawAttestation.trim().toLowerCase()
            : undefined;
    const bindingAttested =
        attestation === "true"
            ? true
            : attestation === "false"
            ? false
            : undefined;
    const requestTokenType = request.tokenType?.trim().toLowerCase();
    const bindingPreferenceSent =
        request.bindingPreferenceSent ?? request.preferBinding !== undefined;

    if (!isDpopBrokerTokenType(requestTokenType)) {
        if (
            isDpopBrokerTokenType(tokenType) ||
            proof !== undefined ||
            rawAttestation !== undefined
        ) {
            fail("unexpected_response", "Unexpected DPoP broker response.");
        }
        return "none";
    }

    if (!isDpopBrokerTokenType(tokenType)) {
        fail("unknown_token_type", "Unknown DPoP broker response.");
    }
    if (rawAttestation !== undefined && bindingAttested === undefined) {
        fail("invalid_attestation", "Conflicting DPoP broker response.");
    }
    if (bindingPreferenceSent && bindingAttested === undefined) {
        fail("missing_attestation", "Conflicting DPoP broker response.");
    }

    if (tokenType === PlatformAuthTokenType.DPOP_WITH_PROOF) {
        if (typeof proof !== "string" || proof.trim().length === 0) {
            fail("missing_proof", "Malformed DPoP broker response.");
        }
        if (bindingAttested !== true) {
            fail("invalid_attestation", "Malformed DPoP broker response.");
        }
        if (requestTokenType !== PlatformAuthTokenType.DPOP_WITH_PROOF) {
            fail("conflicting_fields", "Malformed DPoP broker response.");
        }
        performanceClient.addFields(
            {
                "ext.brokerDpopOutcome": "l3",
                "ext.brokerDpopBindingLevel": "L3",
            },
            correlationId
        );
        return "L3";
    }

    if (
        proof !== undefined ||
        requestTokenType !== PlatformAuthTokenType.DPOP_WITH_PROOF
    ) {
        fail("conflicting_fields", "Malformed DPoP broker L1 response.");
    }
    if (
        bindingAttested !== false &&
        !(bindingPreferenceSent === false && bindingAttested === undefined)
    ) {
        fail("invalid_attestation", "Malformed DPoP broker L1 response.");
    }
    if (!request.reqCnf || !request.keyId) {
        fail("missing_l1_binding", "Malformed DPoP broker L1 response.");
    }

    performanceClient.addFields(
        {
            "ext.brokerDpopOutcome": "l1",
            "ext.brokerDpopBindingLevel": "L1",
        },
        correlationId
    );
    return "L1";
}
