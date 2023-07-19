/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Tenant profile for a given account.
 * objectId     - 
 * tenantId     - 
 * isHomeTenant - 
 */
export type TenantProfile = {
    objectId: string;
    tenantId: string;
    isHomeTenant: boolean;
};
