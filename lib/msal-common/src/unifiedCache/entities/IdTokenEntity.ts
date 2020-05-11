/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { CredentialType } from "../../utils/Constants";
import { AuthenticationResult } from "../../response/AuthenticationResult";

/**
 * ID_TOKEN Cache
 */
export class IdTokenEntity extends Credential {
    realm: string;

    /**
     * Create IdTokenEntity
     * @param homeAccountId
     * @param authenticationResult
     * @param clientId
     * @param authority
     */
    static createIdTokenEntity(
        homeAccountId: string,
        authenticationResult: AuthenticationResult,
        clientId: string,
        environment: string
    ): IdTokenEntity {
        const idTokenEntity = new IdTokenEntity();

        idTokenEntity.credentialType = CredentialType.ID_TOKEN;
        idTokenEntity.homeAccountId = homeAccountId;
        idTokenEntity.environment = environment;
        idTokenEntity.clientId = clientId;
        idTokenEntity.secret = authenticationResult.idToken;
        idTokenEntity.realm = authenticationResult.tenantId;

        return idTokenEntity;
    }
}
