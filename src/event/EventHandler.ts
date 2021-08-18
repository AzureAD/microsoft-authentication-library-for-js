/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, Logger, AccountEntity, CacheManager } from "@azure/msal-common";
import { InteractionType } from "../utils/BrowserConstants";
import { EventCallbackFunction, EventError, EventMessage, EventPayload } from "./EventMessage";
import { EventType } from "./EventType";

export class EventHandler {
    // Callback for subscribing to events
    private eventCallbacks: Map<string, EventCallbackFunction>;
    private logger: Logger;
    private browserCrypto: ICrypto;
    private boundStorageListener: (e: StorageEvent) => void;

    constructor(logger: Logger, browserCrypto: ICrypto) {
        this.eventCallbacks = new Map();
        this.logger = logger;
        this.browserCrypto = browserCrypto;
        this.boundStorageListener = this.handleAccountCacheChange.bind(this);
    }

    /**
     * Adds event callbacks to array
     * @param callback
     */
    addEventCallback(callback: EventCallbackFunction): string | null {
        if (typeof window !== "undefined") {
            if (this.eventCallbacks.size === 0) {
                this.logger.verbose("Adding account storage listener.");
                window.addEventListener("storage", this.boundStorageListener);
            }
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
        if (this.eventCallbacks.size === 0) {
            this.logger.verbose("Removing account storage listener.");
            window.removeEventListener("storage", this.boundStorageListener);
        }
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

    /**
     * Emit account added/removed events when cached accounts are changed in a different tab or frame
     */
    private handleAccountCacheChange(e: StorageEvent): void {
        try {
            const cacheValue = e.newValue || e.oldValue;
            if (!cacheValue) {
                return;
            }
            const parsedValue = JSON.parse(cacheValue);
            if (typeof parsedValue !== "object" || !AccountEntity.isAccountEntity(parsedValue)) {
                return;
            }
            const accountEntity = CacheManager.toObject<AccountEntity>(new AccountEntity(), parsedValue);
            const accountInfo = accountEntity.getAccountInfo();
            if (!e.oldValue && e.newValue) {
                this.logger.info("Account was added to cache in a different window");
                this.emitEvent(EventType.ACCOUNT_ADDED, undefined, accountInfo);
            } else if (!e.newValue && e.oldValue) {
                this.logger.info("Account was removed from cache in a different window");
                this.emitEvent(EventType.ACCOUNT_REMOVED, undefined, accountInfo);
            }
        } catch (e) {
            return;
        }

    }
}
