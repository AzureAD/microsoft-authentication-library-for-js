/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IWebBrokerBridgeMessage } from "./IWebBrokerBridgeMessage.js";

interface PendingRequest<TResp> {
    resolve: (response: TResp) => void;
    reject: (reason: unknown) => void;
}

export type WebBrokerBridgeSendFn<TReq extends IWebBrokerBridgeMessage> = (
    message: TReq
) => void;

/**
 * Correlates outbound requests with inbound responses by `requestId`.
 */
export class PendingRequestRegistry<TResp> {
    private readonly pending = new Map<string, PendingRequest<TResp>>();

    /**
     * Register a pending request. Returns a promise that resolves when a
     * response with the matching `requestId` arrives, or rejects if the
     * caller invokes `reject` for that id.
     */
    register(requestId: string): Promise<TResp> {
        return new Promise<TResp>((resolve, reject) => {
            this.pending.set(requestId, { resolve, reject });
        });
    }

    /** Resolve a pending request. No-op if `requestId` isn't registered. */
    resolve(requestId: string, response: TResp): void {
        const entry = this.pending.get(requestId);
        if (entry === undefined) {
            return;
        }
        this.pending.delete(requestId);
        entry.resolve(response);
    }

    /** Reject a pending request. No-op if `requestId` isn't registered. */
    reject(requestId: string, reason: unknown): void {
        const entry = this.pending.get(requestId);
        if (entry === undefined) {
            return;
        }
        this.pending.delete(requestId);
        entry.reject(reason);
    }

    /** True if `requestId` has an in-flight registration. */
    has(requestId: string): boolean {
        return this.pending.has(requestId);
    }

    /**
     * Register, then invoke `send` synchronously. If `send` throws, the
     * pending entry is cleared and the promise rejects with the thrown
     * error.
     */
    async sendAndAwait<TReq extends IWebBrokerBridgeMessage>(
        message: TReq,
        send: WebBrokerBridgeSendFn<TReq>
    ): Promise<TResp> {
        const promise = this.register(message.requestId);
        try {
            send(message);
        } catch (err) {
            this.reject(message.requestId, err);
        }
        return promise;
    }
}
