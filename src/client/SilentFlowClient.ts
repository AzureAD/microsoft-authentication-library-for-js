/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient"
import { ClientConfiguration } from "../config/ClientConfiguration";
import { SilentFlowRequest } from '../request/SilentFlowRequest';
import { CredentialFilter } from '../unifiedCache/utils/CacheTypes';
import { AuthenticationResult } from '../response/AuthenticationResult';

export class SilentFlowClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    public async acquireToken(request: SilentFlowRequest): Promise<AuthenticationResult>{
        const authority = await this.createAuthority(request.authority);

        if(request.account === null) {
            const atFilter:  CredentialFilter = {
                environment: authority.canonicalAuthorityUrlComponents.HostNameAndPort,
                clientId: this.config.authOptions.clientId,
                target: request.scopes.join(" ")
            };

            const accessToken = this.unifiedCacheManager.getCredentialsFilteredBy(atFilter);

        }


    }
}
