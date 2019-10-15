/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from "./MessageHelper";

export class MessageDispatcher {

    static dispatchMessage(target: Window, message: Message, originCheck?: string) {
        target.postMessage(message, originCheck || "*");
    }
}
