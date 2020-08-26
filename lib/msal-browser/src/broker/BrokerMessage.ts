/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export abstract class BrokerMessage {
    public messageType: string;

    constructor(messageType: string) {
        this.messageType = messageType;
    }
}
