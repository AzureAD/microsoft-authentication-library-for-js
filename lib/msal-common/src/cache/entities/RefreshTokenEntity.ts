/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { Separators, CredentialType } from "../../utils/Constants";
import { AuthenticationResult } from "../../response/AuthenticationResult";

/**
 * REFRESH_TOKEN Cache
 */
export class RefreshTokenEntity extends Credential {
    familyId?: string;

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    generateRefreshTokenEntityKey(): string {
        const refreshTokenKeyArray: Array<string> = [
            this.homeAccountId,
            this.environment,
            this.credentialType
        ];

        // append  familyId if populted, else fallback to clientId
        refreshTokenKeyArray.push(this.familyId ||  this.clientId);

        // realm and target - empty string "" for REFRESH_TOKEN type; target (scopes) is added only if it is resource specific refresh token
        refreshTokenKeyArray.push("");
        refreshTokenKeyArray.push("");

        return refreshTokenKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Create RefreshTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createRefreshTokenEntity(
        homeAccountId: string,
        authenticationResult: AuthenticationResult,
        refreshToken: string,
        clientId: string,
        environment: string
    ): RefreshTokenEntity {
        const rtEntity = new RefreshTokenEntity();

        rtEntity.clientId = clientId;
        rtEntity.credentialType = CredentialType.REFRESH_TOKEN;
        rtEntity.environment = environment;
        rtEntity.homeAccountId = homeAccountId;
        rtEntity.secret = refreshToken;

        if (authenticationResult.familyId)
            rtEntity.familyId = authenticationResult.familyId;

        return rtEntity;
    }
}
