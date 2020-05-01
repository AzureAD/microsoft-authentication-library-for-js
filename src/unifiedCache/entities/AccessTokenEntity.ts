/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { Separators } from "../../utils/Constants";
import { AuthenticationResult } from "../../response/AuthenticationResult";

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

    /**
     * Create AccessTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createAccessTokenEntity(
        homeAccountId: string,
        authenticationResult: AuthenticationResult,
        clientId: string,
        environment: string
    ): AccessTokenEntity {
        const atEntity: AccessTokenEntity = new AccessTokenEntity();

        atEntity.homeAccountId = homeAccountId;
        atEntity.credentialType = "AccessToken";
        atEntity.secret = authenticationResult.accessToken;

        const date = new Date();
        const currentTime = date.getMilliseconds() / 1000;
        atEntity.cachedAt = currentTime.toString();

        // TODO: Crosscheck the exact conversion UTC
        // Token expiry time.
        // This value should be  calculated based on the current UTC time measured locally and the value  expires_in Represented as a string in JSON.
        atEntity.expiresOn = authenticationResult.expiresOn
            .getMilliseconds()
            .toString();
        atEntity.extendedExpiresOn = authenticationResult.extExpiresOn
            .getMilliseconds()
            .toString();

        atEntity.environment = environment;
        atEntity.clientId = clientId;
        atEntity.realm = authenticationResult.tenantId;
        atEntity.target = authenticationResult.scopes.join(" ");

        return atEntity;
    }
}
