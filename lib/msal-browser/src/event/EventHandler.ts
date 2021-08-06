/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, Logger } from "@azure/msal-common";
import { InteractionType } from "../utils/BrowserConstants";
import { EventCallbackFunction, EventError, EventMessage, EventPayload } from "./EventMessage";
import { EventType } from "./EventType";

export class EventHandler {
    // Callback for subscribing to events
    private eventCallbacks: Map<string, EventCallbackFunction>;
    private logger: Logger;
    private browserCrypto: ICrypto;

    constructor(logger: Logger, browserCrypto: ICrypto) {
        this.eventCallbacks = new Map();
        this.logger = logger;
        this.browserCrypto = browserCrypto;
    }

    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(callback: EventCallbackFunction): string | null {
        if (typeof window !== "undefined") {
            const callbackId = this.browserCrypto.createNewGuid();
            this.eventCallbacks.set(callbackId, callback);
            this.logger.verbose(`Event callback registered with id: ${callbackId}`);
    
            return callbackId;
        }
        
        return null;
    }

    /**
     * Removes callback with provided id from callback array
     * @param callbackId
     */
    removeEventCallback(callbackId: string): void {
        this.eventCallbacks.delete(callbackId);
        this.logger.verbose(`Event callback ${callbackId} removed.`);
    }

    /**
     * Emits events by calling callback with event message
     * @param eventType
     * @param interactionType
     * @param payload
     * @param error
     */
    emitEvent(eventType: EventType, interactionType?: InteractionType, payload?: EventPayload, error?: EventError): void {
        if (typeof window !== "undefined") {
            const message: EventMessage = {
                eventType: eventType,
                interactionType: interactionType || null,
                payload: payload || null,
                error: error || null,
                timestamp: Date.now()
            };

            this.logger.info(`Emitting event: ${eventType}`);

            this.eventCallbacks.forEach((callback: EventCallbackFunction, callbackId: string) => {
                this.logger.verbose(`Emitting event to callback ${callbackId}: ${eventType}`);
                callback.apply(null, [message]);
            });
        }
    }

}
