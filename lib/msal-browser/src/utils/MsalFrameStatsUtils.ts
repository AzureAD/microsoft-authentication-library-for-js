/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InProgressPerformanceEvent } from "../../../msal-common/lib/types/exports-browser-only.js";

export function collectInstanceStats(
    currentAppId: string,
    performanceEvent: InProgressPerformanceEvent
): void {
    const frameInstances: string[] =
        // @ts-ignore
        window.msal?.appIds || [];

    const msalInstanceCount = frameInstances.length;

    let sameClientIdInstanceCount = 0;
    /**
     * 1P applications have an app id of the form <clientId>.<channelId>
     * 3P applications have their client id as their app id
     */
    const currentClientId = currentAppId.split(".")[0];
    for (const i of frameInstances) {
        if (i.startsWith(currentClientId)) sameClientIdInstanceCount++;
    }
    performanceEvent.add({
        msalInstanceCount: msalInstanceCount,
        sameClientIdInstanceCount: sameClientIdInstanceCount,
    });
}
