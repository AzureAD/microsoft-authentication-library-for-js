/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { Separators } from "../../utils/Constants";

/**
 * ACCESS_TOKEN Credential Type
 */
export class AccessTokenEntity extends Credential {
    realm: string;
    target: string;
    cachedAt: string;
    expiresOn: string;
    extendedExpiresOn?: string;
    refreshOn?: string;
    keyId?: string; // for POP and SSH tokenTypes
    tokenType?: string;

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    public generateAccessTokenEntityKey(): string {
        const accessTokenKeyArray: Array<string> = [
            this.homeAccountId,
            this.environment,
            this.credentialType,
            this.clientId,
            this.realm,
            this.target
        ];

        return accessTokenKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }
}
