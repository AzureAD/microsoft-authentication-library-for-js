/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum BridgeStatusCode {
    USER_INTERACTION_REQUIRED = "USER_INTERACTION_REQUIRED",
    USER_CANCEL = "USER_CANCEL",
    NO_NETWORK = "NO_NETWORK",
    TRANSIENT_ERROR = "TRANSIENT_ERROR",
    PERSISTENT_ERROR = "PERSISTENT_ERROR",
    DISABLED = "DISABLED",
    ACCOUNT_UNAVAILABLE = "ACCOUNT_UNAVAILABLE",
    NESTED_APP_AUTH_UNAVAILABLE = "NESTED_APP_AUTH_UNAVAILABLE", // NAA is unavailable in the current context, can retry with standard browser based auth
}
