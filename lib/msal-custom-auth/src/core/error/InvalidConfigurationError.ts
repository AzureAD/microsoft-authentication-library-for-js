/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthError } from "./CustomAuthError.js";

export class InvalidConfigurationError extends CustomAuthError {
    constructor(error: string, message: string, correlationId?: string) {
        super(error, message, correlationId);
        Object.setPrototypeOf(this, InvalidConfigurationError.prototype);
    }
}

export const MissingConfiguration = "missing_configuration";
export const InvalidAuthority = "invalid_authority";
export const InvalidAuthApiProxyDomain = "invalid_auth_api_proxy_domain";
