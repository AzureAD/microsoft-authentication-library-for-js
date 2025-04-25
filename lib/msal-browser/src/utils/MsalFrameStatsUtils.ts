/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InProgressPerformanceEvent } from "../../../msal-common/lib/types/exports-browser-only.js";

export type MsalInstanceMetadata = {
    appId: string;
};

function getBrokerCount(): Promise<number> {
    return new Promise((resolve) => {
        const requestId = crypto.randomUUID();
        const counts: number[] = [];
        const respondedWindows = new Set<Window>();

        const handleMessage = (event: MessageEvent) => {
            const data = event.data;
            if (data?.type === 'brokerCountResponse' && data.requestId === requestId) {
                const source = event.source as Window;
                if (!respondedWindows.has(source)) {
                    respondedWindows.add(source);
                    if (typeof data.count === 'number' && data.count > 0) {
                        counts.push(data.count);
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);

        const message = {
            type: 'getBrokerCount',
            requestId,
        };

        try {
            window.parent.postMessage(message, '*');
        } catch (e) {}

        for (let i = 0; i < window.frames.length; i++) {
            try {
                window.frames[i].postMessage(message, '*');
            } catch (e) {}
        }

        window.postMessage(message, '*');

        setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            const total = counts.reduce((sum, c) => sum + c, 0);
            resolve(total);
        }, 200);
    });
}


// function getBrokerCount(): number {
//     let ancestorBrokerCount = 0;
//     let frameCounter = 0;

//     let current: Window | null = window;
//     while (current && current.parent && current.parent !== current && frameCounter < 50) {
//         frameCounter++;
//         try {
//             current = current.parent;
//             // @ts-ignore
//             if (current.msal.brokerCount) {
//                 // @ts-ignore
//                 ancestorBrokerCount += current.msal.brokerCount;
//             }
//         } catch (e) {
//             // Skip frames we can't access (cross-origin)   
//             break;
//         }
//     }

//     function getDescendantBrokerCount(): number {
//         let brokerCount = 0;
//         let frameCounter = 0;
//         const visited = new Set<Window>();
//         const queue: Window[] = [window];
    
//         while (queue.length > 0 && frameCounter < 50) {
//             const frame = queue.pop();
//             if (!frame || visited.has(frame)) continue;
//             visited.add(frame);
    
//             try {
//                 // @ts-ignore
//                 if (frame.msal?.brokerCount) {
//                     // @ts-ignore   
//                     brokerCount += frame.msal.brokerCount;
//                 }
    
//                 frameCounter++;
    
//                 for (let i = 0; i < frame.frames.length; i++) {
//                     try {
//                         const child = frame.frames[i];
//                         if (!visited.has(child)) {
//                             queue.push(child);
//                         }
//                     } catch (e) {
//                         // Skip frames we can't access (cross-origin)
//                         continue;
//                     }
//                 }
//             } catch (e) {
//                 // Skip frames we can't access (cross-origin)
//                 continue;
//             }
//         }
    
//         return brokerCount;
//     }
    

//     const descendantBrokerCount = getDescendantBrokerCount();
//     // @ts-ignore
//     return ancestorBrokerCount + descendantBrokerCount;
// }

export async function collectInstanceStats(currentAppId: string, performanceEvent: InProgressPerformanceEvent): void {
    const brokerCount = await getBrokerCount();

    const frameInstances: string[] =
        // @ts-ignore
        window.msal?.appIds || [];

    const msalInstanceCount = frameInstances.length;

    let sameClientIdCount = 0;
    /**
     * 1P applications have an app id of the form <clientId>.<channelId>
     * 3P applications have their client id as their app id
     */
    const currentClientId = currentAppId.split(".")[0];
    for (const i of frameInstances) {
        if (i.startsWith(currentClientId)) sameClientIdCount++;
    }

    sessionStorage.setItem(`sameClientIdCount.${currentClientId}`, JSON.stringify(sameClientIdCount));
    sessionStorage.setItem(`msalInstanceCount`, JSON.stringify(msalInstanceCount));
    sessionStorage.setItem(`brokerCountInFrameTree`, JSON.stringify(brokerCount));
    performanceEvent.add({
        msalInstanceCount: msalInstanceCount,
        sameClientIdCount: sameClientIdCount,
        brokerCountInFrameTree: brokerCount,
    });
}
