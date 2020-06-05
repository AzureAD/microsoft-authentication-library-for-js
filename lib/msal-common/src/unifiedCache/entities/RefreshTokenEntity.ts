/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { CredentialType } from "../../utils/Constants";

/**
 * REFRESH_TOKEN Cache
 */
export class RefreshTokenEntity extends Credential {
    familyId?: string;

    /**
     * Create RefreshTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createRefreshTokenEntity(
        homeAccountId: string,
        environment: string,
        refreshToken: string,
        clientId: string,
        familyId?: string
    ): RefreshTokenEntity {
        const rtEntity = new RefreshTokenEntity();

        rtEntity.clientId = clientId;
        rtEntity.credentialType = CredentialType.REFRESH_TOKEN;
        rtEntity.environment = environment;
        rtEntity.homeAccountId = homeAccountId;
        rtEntity.secret = refreshToken;

        if (familyId)
            rtEntity.familyId = familyId;

        return rtEntity;
    }
}
