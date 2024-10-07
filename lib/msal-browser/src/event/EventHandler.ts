/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common/browser";
import { InteractionType } from "../utils/BrowserConstants.js";
import {
    EventCallbackFunction,
    EventError,
    EventMessage,
    EventPayload,
} from "./EventMessage.js";
import { EventType } from "./EventType.js";
import { createGuid } from "../utils/BrowserUtils.js";

export class EventHandler {
    // Callback for subscribing to events
    private eventCallbacks: Map<
        string,
        [EventCallbackFunction, Array<EventType>]
    >;
    private logger: Logger;

    constructor(logger?: Logger) {
        this.eventCallbacks = new Map();
        this.logger = logger || new Logger({});
    }

    /**
     * Adds event callbacks to array
     * @param callback - callback to be invoked when an event is raised
     * @param eventTypes - list of events that this callback will be invoked for, if not provided callback will be invoked for all events
     * @param callbackId - Identifier for the callback, used to locate and remove the callback when no longer required
     */
    addEventCallback(
        callback: EventCallbackFunction,
        eventTypes?: Array<EventType>,
        callbackId?: string
    ): string | null {
        if (typeof window !== "undefined") {
            const id = callbackId || createGuid();
            if (this.eventCallbacks.has(id)) {
                this.logger.error(
                    `Event callback with id: ${id} is already registered. Please provide a unique id or remove the existing callback and try again.`
                );
                return null;
            }
            this.eventCallbacks.set(id, [callback, eventTypes || []]);
            this.logger.verbose(`Event callback registered with id: ${id}`);

            return id;
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
                (
                    [callback, eventTypes]: [
                        EventCallbackFunction,
                        Array<EventType>
                    ],
                    callbackId: string
                ) => {
                    if (
                        eventTypes.length === 0 ||
                        eventTypes.includes(eventType)
                    ) {
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
