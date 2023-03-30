/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface AuthBridge {
    addEventListener: (
        eventName: string,
        callback: (response: string) => void
    ) => void;
    postMessage: (message: string) => void;
    removeEventListener: (
        eventName: string,
        callback: (response: string) => void
    ) => void;
}
