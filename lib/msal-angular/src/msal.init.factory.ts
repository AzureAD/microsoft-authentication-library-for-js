/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MsalBroadcastService } from "./msal.broadcast.service";
import { MsalService } from "./msal.service";

export function msalInitFactory(
    authService: MsalService,
    msalBroadcastService: MsalBroadcastService
): () => Promise<void> {
    return async (): Promise<void> => {
        // Subscribing so events in MsalGuard will set inProgress$ observable
        msalBroadcastService.inProgress$.subscribe();

        await authService.handleRedirectObservable().toPromise();
    };
}
