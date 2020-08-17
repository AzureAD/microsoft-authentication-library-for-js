/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { APP_META_DATA, Separators } from "../../utils/Constants";

/**
 * APP_META_DATA Cache
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
        const appMetaDataKeyArray: Array<string> = [APP_META_DATA, this.environment, this.clientId];
        return appMetaDataKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }
}
