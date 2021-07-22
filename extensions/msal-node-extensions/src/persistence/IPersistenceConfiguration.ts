/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DataProtectionScope } from "./DataProtectionScope";

export interface IPersistenceConfiguration {
    cachePath?: string,
    dataProtectionScope?: DataProtectionScope,
    serviceName?: string,
    accountName?: string,
    usePlaintextFileOnLinux?: boolean,
}
