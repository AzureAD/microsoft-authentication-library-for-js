/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Base type for credentials to be stored in the cache: eg: ACCESS_TOKEN, ID_TOKEN etc
 */
export class Credential {
    homeAccountId: string;
    environment: string;
    credentialType: string;
    clientId: string;
    secret: string;
};
