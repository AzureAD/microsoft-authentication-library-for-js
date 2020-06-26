/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Specifies the scope of the data protection - either the current user or the local
 * machine.
 *
 * You do not need a key to protect or unprotect the data.
 * If you set the Scope to CurrentUser, only applications running on your credentials can
 * unprotect the data; however, that means that any application running on your credentials
 * can access the protected data. If you set the Scope to LocalMachine, any full-trust
 * application on the computer can unprotect, access, and modify the data.
 *
 */
export enum DataProtectionScope {
    CurrentUser = "CurrentUser",
    LocalMachine = "LocalMachine",
}
