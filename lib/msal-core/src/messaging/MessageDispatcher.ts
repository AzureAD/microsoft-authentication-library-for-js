/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MESSAGE_SCHEMA } from "./MessageHelper";

export class MessageDispatcher {

    static dispatchMessage(target: Window, message: MESSAGE_SCHEMA, originCheck?: string) {
        originCheck ? target.postMessage(message, originCheck): target.postMessage(message, "*");
    }
}
