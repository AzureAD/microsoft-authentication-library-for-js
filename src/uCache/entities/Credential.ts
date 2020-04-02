/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Serializable } from "../serialize/Serializable";

/**
 * Base type for credentials to be stored in the cache: eg: ACCESS_TOKEN, ID_TOKEN etc
 */
export class Credential extends Serializable{
    homeAccountId: string;
    environment: string;
    credentialType: string;
    clientId: string;
    secret: string;
};
