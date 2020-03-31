/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { Separators } from "../../utils/Constants";

/**
 * REFRESH_TOKEN Cache
 */
export class RefreshTokenCache extends Credential {
    familyId?: string;

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    generateRefreshTokenKey(): string {
        const refreshTokenKeyArray: Array<string> = [
            this.homeAccountId,
            this.environment,
            this.credentialType
        ];

        if (this.familyId) {
            refreshTokenKeyArray.push(this.familyId);
        } else {
            refreshTokenKeyArray.push(this.clientId);
        }

        // realm and target - empty string "" for REFRESH_TOKEN type
        refreshTokenKeyArray.push("");
        refreshTokenKeyArray.push("");

        return refreshTokenKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }
}
