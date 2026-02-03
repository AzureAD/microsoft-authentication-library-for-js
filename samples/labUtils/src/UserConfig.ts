/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LabResponseHelper } from "./LabResponseHelper";

/**
 * Represents user configuration retrieved from Key Vault.
 * This maps to the 'user' property in Key Vault secret JSON.
 */
export type UserConfig = {
    /** The object ID (GUID) of the user in Azure AD */
    objectId?: string;

    /** The type of user (e.g., "Cloud", "Federated", "B2C", "MSA") */
    userType?: string;

    /** The user principal name (email) for sign-in */
    upn?: string;

    /** The home UPN for guest users */
    homeUPN?: string;

    /** The B2C identity provider (e.g., "Local", "Facebook", "Google") */
    b2cProvider?: string;

    /** The name of the lab environment this user belongs to */
    labName?: string;

    /** The federation provider (e.g., "None", "ADFSv4") */
    federationProvider?: string;

    /** The tenant ID where the user resides */
    tenantId?: string;

    /** The application ID associated with this user config */
    appId?: string;

    /** The Azure environment (e.g., "azurecloud", "azureusgovernment") */
    azureEnvironment?: string;
};

/**
 * Extended user config with password retrieval capability.
 */
export class LabUser implements UserConfig {
    objectId?: string;
    userType?: string;
    upn?: string;
    homeUPN?: string;
    b2cProvider?: string;
    labName?: string;
    federationProvider?: string;
    tenantId?: string;
    appId?: string;
    azureEnvironment?: string;

    private _password: string | null = null;

    constructor(config: UserConfig) {
        Object.assign(this, config);
    }

    /**
     * Gets the user's password, fetching from Key Vault if not already cached.
     * @returns The user's password
     */
    async getPassword(): Promise<string> {
        if (this._password === null) {
            if (!this.labName) {
                throw new Error(
                    "Cannot fetch password: labName is not set on user config"
                );
            }
            this._password = await LabResponseHelper.fetchUserPassword(
                this.labName
            );
        }
        return this._password;
    }
}
