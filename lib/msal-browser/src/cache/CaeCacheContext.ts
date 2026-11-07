/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { BrowserCacheManager } from "./BrowserCacheManager.js";
import type { SilentRequest } from "../request/SilentRequest.js";
import type { AuthenticationResult } from "../response/AuthenticationResult.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { rejectCaeCacheExperiment } from "../request/CaeCacheRequest.js";

/** An experimental CP1 cache namespace sharing its owner's authentication state. */
export interface CaeCacheContext {
    /** Acquires through the existing owner; the request must advertise CP1. */
    acquireTokenSilent(request: SilentRequest): Promise<AuthenticationResult>;
    /** Fences pending acquisitions and removes this context's CP1 cache; remains usable. */
    reset(): Promise<void>;
    /** Fences synchronously, removes CP1 cache, and permanently retires this handle. */
    retire(): Promise<void>;
}

type ContextState = {
    storage: BrowserCacheManager;
    id: string;
    epoch: string;
    retired: boolean;
};

const contexts = new WeakMap<CaeCacheContext, ContextState>();

/** Creates the handle after its identifier has been hashed by the owner. */
export function createCaeCacheContextHandle(
    storage: BrowserCacheManager,
    id: string,
    acquire: (request: SilentRequest) => Promise<AuthenticationResult>
): CaeCacheContext {
    const state: ContextState = {
        storage,
        id,
        epoch: storage.getCapabilityContextEpoch(id, ""),
        retired: false,
    };
    let retirement: Promise<void> | undefined;
    const handle: CaeCacheContext = Object.freeze({
        acquireTokenSilent: (request: SilentRequest) =>
            acquire({ ...request, caeCacheContext: handle }),
        reset: async () => {
            if (state.retired) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.caeTokenRequestInvalidated,
                    ""
                );
            }
            storage.resetCapabilityContext(id);
            if (!state.retired) {
                state.epoch = storage.getCapabilityContextEpoch(id, "");
            }
        },
        retire: () => {
            if (!retirement) {
                let resolve!: () => void;
                let reject!: (error: unknown) => void;
                retirement = new Promise<void>((onResolved, onRejected) => {
                    resolve = onResolved;
                    reject = onRejected;
                });
                state.retired = true;
                try {
                    storage.resetCapabilityContext(id, state.epoch);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
            return retirement;
        },
    });
    contexts.set(handle, state);
    return handle;
}

/** Captures the lifetime synchronously, before authority discovery or token acquisition. */
export function captureCaeCacheContext(
    handle: CaeCacheContext,
    storage: BrowserCacheManager,
    correlationId: string
): { contextId: string; contextEpoch: string } {
    const state = contexts.get(handle);
    if (!state || state.storage !== storage) {
        rejectCaeCacheExperiment(correlationId);
    }
    if (state.retired) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.caeTokenRequestInvalidated,
            correlationId
        );
    }
    state.epoch = storage.getCapabilityContextEpoch(state.id, correlationId);
    return {
        contextId: state.id,
        contextEpoch: state.epoch,
    };
}
