/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    Constants,
    CredentialEntity,
} from "@azure/msal-common/node";
import { createHash } from "crypto";
import { CACHE } from "../utils/Constants.js";

/**
 * Computes a combined hash from additional cache key components.
 * Matches the cross-SDK algorithm: sort keys → concatenate key+value → SHA-256 → Base64URL (no padding).
 */
function computeAdditionalCacheKeyHash(
    components: Record<string, string>
): string {
    const sortedKeys = Object.keys(components).sort();
    const input = sortedKeys.map((k) => k + components[k]).join("");
    return createHash("sha256").update(input, "utf8").digest("base64url");
}

export function generateCredentialKey(credential: CredentialEntity): string {
    const familyId =
        (credential.credentialType === Constants.CredentialType.REFRESH_TOKEN &&
            credential.familyId) ||
        credential.clientId;
    const scheme =
        credential.tokenType &&
        credential.tokenType.toLowerCase() !==
            Constants.AuthenticationScheme.BEARER.toLowerCase()
            ? credential.tokenType.toLowerCase()
            : "";
    const credentialKey = [
        credential.homeAccountId,
        credential.environment,
        credential.credentialType,
        familyId,
        credential.realm || "",
        credential.target || "",
        scheme,
    ];

    /*
     * Compute and append a combined hash from additional cache key components (e.g., fmi_path).
     * Prefer the precomputed hash persisted on the entity (written at cache-write time in
     * ResponseHandler via the async `ICrypto.hashString`) so that all runtimes agree on the
     * same hashed value even when they cannot recompute it synchronously. Fall back to the
     * legacy inline compute for entities persisted before the precompute contract landed.
     */
    if (
        credential.additionalCacheKeyComponents &&
        Object.keys(credential.additionalCacheKeyComponents).length > 0
    ) {
        credentialKey.push(
            credential.additionalCacheKeyComponentsHash ||
                computeAdditionalCacheKeyHash(
                    credential.additionalCacheKeyComponents
                )
        );
    }

    return credentialKey.join(CACHE.KEY_SEPARATOR).toLowerCase();
}

export function generateAccountKey(account: AccountInfo): string {
    const homeTenantId = account.homeAccountId.split(".")[1];
    const accountKey = [
        account.homeAccountId,
        account.environment,
        homeTenantId || account.tenantId || "",
    ];

    return accountKey.join(CACHE.KEY_SEPARATOR).toLowerCase();
}
