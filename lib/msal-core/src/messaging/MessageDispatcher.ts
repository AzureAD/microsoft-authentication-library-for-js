/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PAYLOAD } from "./MessageHelper";

export class MessageDispatcher {

    static dispatchMessage(target: Window, message: PAYLOAD, originCheck?: string) {
        originCheck ? target.postMessage(message, originCheck): target.postMessage(message, "*");
    }
}
