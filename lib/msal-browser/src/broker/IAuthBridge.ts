/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Auth bridge interface, must be available on window object injected by the host or some other means external to MSAL.js
 */
export interface IAuthBridge {
    /**
     * Sends a message to broker server and receives a reply in the promise result
     * @param payload Message payload to be sent to broker server
     */
    postMessage(payload: any): Promise<any>;

    /**
     * Adds a handler for an event originating from broker server. Can throw exception if handler for event type already exists.
     * @param eventType Type of event to add the listner for.
     * @param listener The handler to listen on the events.
     */
    addEventListener(eventType: string, listener: EventHandler): void;

    /**
     * Removes a handler added by addEventListener. Can throw exception if no such handler was added
     * @param eventType Type of event handler to remove.
     */
    removeEventListener(eventType: string): void;
}

type EventHandler = (event: any) => void;
