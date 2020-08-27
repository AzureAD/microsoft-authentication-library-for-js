/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { APP_METADATA, Separators } from "../../utils/Constants";

/**
 * APP_METADATA Cache
 *
 * Key:Value Schema:
 *
 * Key: appmetadata-<environment>-<client_id>
 *
 * Value:
 * {
 *      clientId: client ID of the application
 *      environment: entity that issued the token, represented as a full host
 *      familyId: Family ID identifier, '1' represents Microsoft Family
 * }
 */
export class AppMetadataEntity {
    clientId: string;
    environment: string;
    familyId?: string;

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    generateAppMetaDataEntityKey(): string {
        const appMetaDataKeyArray: Array<string> = [APP_METADATA, this.environment, this.clientId];
        return appMetaDataKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Creates AppMetadataEntity
     * @param clientId
     * @param environment
     * @param familyId
     */
    static createAppMetadataEntity(clientId: string, environment: string, familyId?: string): AppMetadataEntity {
        const appMetadata = new AppMetadataEntity();

        appMetadata.clientId = clientId;
        appMetadata.environment = environment;
        if (familyId) {
            appMetadata.familyId = familyId;
        }

        return appMetadata;
    }

    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    static isAppMetadataEntity(key: string, entity: object): boolean {
        return (
            (key.indexOf(APP_METADATA) === 0) &&
            entity.hasOwnProperty("clientId") &&
            entity.hasOwnProperty("environment")
        );
    }
}
