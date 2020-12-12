/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AUTHORITY_METADATA_CONSTANTS } from "../../utils/Constants";
import { TimeUtils } from "../../utils/TimeUtils";

export class AuthorityMetadataEntity {
    aliases: Array<string>;
    preferred_cache: string;
    preferred_network: string;
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint: string;
    issuer: string;
    fromNetwork: boolean;
    expiresAt: number;

    static createAuthorityMetadataEntity(
        aliases: Array<string>, 
        preferred_cache: string,
        preferred_network: string,
        authorization_endpoint: string,
        token_endpoint: string,
        end_session_endpoint: string,
        issuer: string,
        fromNetwork: boolean
    ): AuthorityMetadataEntity {
        const entity = new AuthorityMetadataEntity();
        entity.aliases = aliases;
        entity.preferred_cache = preferred_cache;
        entity.preferred_network = preferred_network;
        entity.authorization_endpoint = authorization_endpoint;
        entity.token_endpoint = token_endpoint;
        entity.end_session_endpoint = end_session_endpoint;
        entity.issuer = issuer;
        entity.fromNetwork = fromNetwork;
        entity.expiresAt = TimeUtils.nowSeconds() + AUTHORITY_METADATA_CONSTANTS.REFRESH_TIME_SECONDS;

        return entity;
    }

    /**
     * Returns whether or not the data needs to be refreshed
     * Will always return false if the data comes from config
     */
    isExpired(): boolean {
        return this.fromNetwork && this.expiresAt < TimeUtils.nowSeconds();
    }

    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    static isAuthorityMetadataEntity(key: string, entity: object): boolean {

        if (!entity) {
            return false;
        }

        return (
            key.indexOf(AUTHORITY_METADATA_CONSTANTS.CACHE_KEY) === 0 &&
            entity.hasOwnProperty("aliases") &&
            entity.hasOwnProperty("preferred_cache") &&
            entity.hasOwnProperty("preferred_network") &&
            entity.hasOwnProperty("authorization_endpoint") &&
            entity.hasOwnProperty("token_endpoint") &&
            entity.hasOwnProperty("end_session_endpoint") &&
            entity.hasOwnProperty("issuer") &&
            entity.hasOwnProperty("fromNetwork") &&
            entity.hasOwnProperty("expiresAt")
        );
    }
}
