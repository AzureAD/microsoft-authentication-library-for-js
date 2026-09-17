/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PublicClientApplication } from "@azure/msal-node";

/*
 * Existing subclasses may already declare these private names. Coalescing
 * internals must remain module-scoped to preserve source compatibility.
 */
class ExistingSubclassMembers extends PublicClientApplication {
    private activeSilentTokenRequests = new Map();
    private acquireTokenSilentDeduped = (): void => {};
    private getSilentRequestKey = (): string => "";
}

void PublicClientApplication;
void ExistingSubclassMembers;
