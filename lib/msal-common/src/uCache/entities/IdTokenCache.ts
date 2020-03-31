/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { Separators } from "../../utils/Constants";

/**
 * ID_TOKEN Cache
 */
export class IdTokenCache extends Credential {
    realm: string;

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    generateIdTokenKey(): string {
        const idTokenKeyArray: Array<string> = [
            this.homeAccountId,
            this.environment,
            this.credentialType,
            this.clientId,
            this.realm,
            ""
        ];

        return idTokenKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }
}
