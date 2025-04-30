/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InProgressPerformanceEvent } from "@azure/msal-common/browser";

export function collectInstanceStats(
    currentClientId: string,
    performanceEvent: InProgressPerformanceEvent
): void {
    const frameInstances: string[] =
        // @ts-ignore
        window.msal?.clientIds || [];

    const msalInstanceCount = frameInstances.length;

    let sameClientIdInstanceCount = 0;

    for (const i of frameInstances) {
        if (i == currentClientId) sameClientIdInstanceCount++;
    }
    performanceEvent.add({
        msalInstanceCount: msalInstanceCount,
        sameClientIdInstanceCount: sameClientIdInstanceCount,
    });
}
