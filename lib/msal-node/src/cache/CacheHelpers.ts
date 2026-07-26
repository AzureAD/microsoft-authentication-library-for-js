/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    Constants,
    CredentialEntity,
    CacheHelpers as CommonCacheHelpers,
} from "@azure/msal-common/node";
import { createHash } from "crypto";
import { CACHE } from "../utils/Constants.js";

/**
 * Computes a combined hash from additional cache key components using (SHA-256 → Base64URL, no padding)
 *
 * Node uses createHash directly (rather than the injected async hashString interface)
 * because generateCredentialKey is called synchronously from cache lookup paths.
 */
export function computeAdditionalCacheKeyHash(
    components: Record<string, string>
): string {
    const payload =
        CommonCacheHelpers.getAdditionalCacheKeyComponentsHashPayload(
            components
        );
    return createHash("sha256").update(payload, "utf8").digest("base64url");
}

export function generateCredentialKey(
    credential: CredentialEntity,
    hash?: string
): string {
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
     * Use the explicitly passed hash if available; fall back to synchronous inline compute
     * for lookup paths where the entity was read from storage without a cached hash.
     */
    if (
        credential.additionalCacheKeyComponents &&
        Object.keys(credential.additionalCacheKeyComponents).length > 0
    ) {
        credentialKey.push(
            hash ??
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
