/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Separators, CredentialType, CacheType } from "../../utils/Constants";

/**
 * Base type for credentials to be stored in the cache: eg: ACCESS_TOKEN, ID_TOKEN etc
 */
export class Credential {
    homeAccountId: string;
    environment: string;
    credentialType: CredentialType;
    clientId: string;
    secret: string;
    familyId?: string;
    realm?: string;
    target?: string;

    /**
     * Generate Account Id key component as per the schema: <home_account_id>-<environment>
     */
    generateAccountId(): string {
        const accountId: Array<string> = [this.homeAccountId, this.environment];
        return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate Credential Id key component as per the schema: <credential_type>-<client_id>-<realm>
     */
    generateCredentialId(): string {
        const clientOrFamilyId = CredentialType.REFRESH_TOKEN
            ? this.familyId || this.clientId
            : this.clientId;
        const credentialId: Array<string> = [
            this.credentialType,
            clientOrFamilyId,
            this.realm || "",
        ];

        return credentialId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate target key component as per schema: <target>
     */
    generateTarget(): string {
        return (this.target || "").toLowerCase();
    }

    /**
     * generates credential key
     */
    generateCredentialKey(): string {
        const credentialKey = [
            this.generateAccountId(),
            this.generateCredentialId(),
            this.generateTarget(),
        ];

        return credentialKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * returns the type of the cache (in this case credential)
     */
    generateType(): number {
        switch (this.credentialType) {
            case CredentialType.ID_TOKEN:
                return CacheType.ID_TOKEN;
            case CredentialType.ACCESS_TOKEN:
                return CacheType.ACCESS_TOKEN;
            case CredentialType.REFRESH_TOKEN:
                return CacheType.REFRESH_TOKEN;
            default: {
                console.log("Unexpected credential type");
                return null;
            }
        }
    }
}
