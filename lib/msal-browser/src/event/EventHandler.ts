/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    Logger,
    AccountEntity,
    CacheManager,
    PersistentCacheKeys,
} from "@azure/msal-common/browser";
import { InteractionType } from "../utils/BrowserConstants.js";
import {
    EventCallbackFunction,
    EventError,
    EventMessage,
    EventPayload,
} from "./EventMessage.js";
import { EventType } from "./EventType.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";

export class EventHandler {
    // Callback for subscribing to events
    private eventCallbacks: Map<string, [EventCallbackFunction, Array<EventType>]>;
    private logger: Logger;

    constructor(logger?: Logger) {
        this.eventCallbacks = new Map();
        this.logger = logger || new Logger({});
    }

    /**
     * Adds event callbacks to array
     * @param callback - callback to be invoked when an event is raised
     * @param eventTypes - list of events that this callback will be invoked for, if not provided callback will be invoked for all events
     */
    addEventCallback(callback: EventCallbackFunction, eventTypes?: Array<EventType>): string | null {
        if (typeof window !== "undefined") {
            const callbackId = createNewGuid();
            this.eventCallbacks.set(callbackId, [callback, eventTypes || []]);
            this.logger.verbose(
                `Event callback registered with id: ${callbackId}`
            );

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
    emitEvent(
        eventType: EventType,
        interactionType?: InteractionType,
        payload?: EventPayload,
        error?: EventError
    ): void {
        if (typeof window !== "undefined") {
            const message: EventMessage = {
                eventType: eventType,
                interactionType: interactionType || null,
                payload: payload || null,
                error: error || null,
                timestamp: Date.now(),
            };

            this.eventCallbacks.forEach(
                ([callback, eventTypes]: [EventCallbackFunction, Array<EventType>], callbackId: string) => {
                    if (eventTypes.length === 0 || eventTypes.includes(eventType)) {
                        this.logger.verbose(
                            `Emitting event to callback ${callbackId}: ${eventType}`
                        );
                        callback.apply(null, [message]);
                    }
                }
            );
        }
    }
}
