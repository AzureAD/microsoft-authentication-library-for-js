/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Credential } from "./Credential";
import { CredentialType } from "../../utils/Constants";

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
        environment: string,
        idToken: string,
        clientId: string,
        tenantId: string
    ): IdTokenEntity {
        const idTokenEntity = new IdTokenEntity();

        idTokenEntity.credentialType = CredentialType.ID_TOKEN;
        idTokenEntity.homeAccountId = homeAccountId;
        idTokenEntity.environment = environment;
        idTokenEntity.clientId = clientId;
        idTokenEntity.secret = idToken;
        idTokenEntity.realm = tenantId;

        return idTokenEntity;
    }
}
