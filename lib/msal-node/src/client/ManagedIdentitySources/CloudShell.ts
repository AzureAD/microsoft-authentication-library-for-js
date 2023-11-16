/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";

export class CloudShell extends BaseManagedIdentitySource {
    public createRequest(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _resource: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _managedIdentityId: ManagedIdentityId
    ): ManagedIdentityRequestParameters {
        throw new Error("Method not implemented.");
    }
}
