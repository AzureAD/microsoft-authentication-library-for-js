/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    canonicalizeDpopResourceServer,
    DpopNonceRecord,
    IDpopNonceStore,
    IPerformanceClient,
    Logger,
    validateDpopNonce,
} from "@azure/msal-common/browser";
import { PREFIX } from "../cache/CacheKeys.js";

const MAX_RESOURCE_SERVER_NONCES = 50;
const REDIRECT_HANDOFF_TTL_MS = 5 * 60 * 1000;
const REDIRECT_HANDOFF_CACHE_SUFFIX = "dpop.nonce.redirect";

/**
 * Tab-scoped, one-shot resource-server nonce state used only to preserve an
 * active DPoP redirect request across full-page navigation.
 * @internal
 */
type DpopNonceRedirectHandoff = {
    nonce: string;
    resourceServer: string;
    state: string;
    correlationId: string;
    expiresAt: number;
};

/**
 * Controller-owned, memory-only resource-server DPoP nonce state.
 * @internal
 */
export class DpopNonceStore implements IDpopNonceStore {
    private readonly resourceServerNonces = new Map<string, DpopNonceRecord>();
    private readonly redirectHandoffCacheKey: string;
    private readonly logger?: Logger;
    private readonly performanceClient?: IPerformanceClient;
    private nextVersion = 0;

    constructor(
        clientId: string = "",
        logger?: Logger,
        performanceClient?: IPerformanceClient
    ) {
        this.redirectHandoffCacheKey = `${PREFIX}.${clientId}.${REDIRECT_HANDOFF_CACHE_SUFFIX}`;
        this.logger = logger;
        this.performanceClient = performanceClient;
    }

    setResourceServerNonce(
        resourceRequestUri: string,
        dpopNonce: string,
        correlationId: string = ""
    ): void {
        const resourceServer = canonicalizeDpopResourceServer(
            resourceRequestUri,
            correlationId
        );
        const validatedNonce = validateDpopNonce(dpopNonce, correlationId);

        const record = {
            nonce: validatedNonce,
            version: ++this.nextVersion,
        };
        this.resourceServerNonces.delete(resourceServer);
        this.resourceServerNonces.set(resourceServer, record);

        if (this.resourceServerNonces.size > MAX_RESOURCE_SERVER_NONCES) {
            const oldestResourceServer = this.resourceServerNonces
                .keys()
                .next().value;
            if (oldestResourceServer) {
                this.resourceServerNonces.delete(oldestResourceServer);
            }
        }
    }

    getResourceServerNonce(
        resourceRequestUri: string,
        correlationId: string = ""
    ): DpopNonceRecord | undefined {
        const resourceServer = canonicalizeDpopResourceServer(
            resourceRequestUri,
            correlationId
        );
        return this.resourceServerNonces.get(resourceServer);
    }

    saveRedirectHandoff(
        resourceRequestUri: string,
        state: string,
        correlationId: string
    ): void {
        if (typeof window === "undefined" || !state || !correlationId) {
            return;
        }

        const resourceServer = canonicalizeDpopResourceServer(
            resourceRequestUri,
            correlationId
        );
        const record = this.resourceServerNonces.get(resourceServer);
        if (!record) {
            return;
        }

        const handoff: DpopNonceRedirectHandoff = {
            nonce: record.nonce,
            resourceServer,
            state,
            correlationId,
            expiresAt: Date.now() + REDIRECT_HANDOFF_TTL_MS,
        };

        try {
            window.sessionStorage.setItem(
                this.redirectHandoffCacheKey,
                JSON.stringify(handoff)
            );
        } catch {
            this.performanceClient?.incrementFields(
                { "ext.dpopNonceRedirectHandoffSaveFailureCount": 1 },
                correlationId
            );
            this.logger?.warning(
                "Unable to save the DPoP nonce redirect handoff.",
                correlationId
            );
            // The in-memory nonce remains available until navigation.
        }
    }

    restoreRedirectHandoff(
        resourceRequestUri: string,
        state: string,
        correlationId: string
    ): void {
        if (typeof window === "undefined") {
            return;
        }

        let serializedHandoff: string | null = null;
        try {
            serializedHandoff = window.sessionStorage.getItem(
                this.redirectHandoffCacheKey
            );
            window.sessionStorage.removeItem(this.redirectHandoffCacheKey);
        } catch {
            this.performanceClient?.incrementFields(
                { "ext.dpopNonceRedirectHandoffRestoreFailureCount": 1 },
                correlationId
            );
            this.logger?.warning(
                "Unable to read or clear the DPoP nonce redirect handoff.",
                correlationId
            );
            return;
        }

        if (!serializedHandoff) {
            return;
        }

        let parsedHandoff: unknown;
        try {
            parsedHandoff = JSON.parse(serializedHandoff);
        } catch {
            this.logger?.warning(
                "Ignoring an invalid DPoP nonce redirect handoff.",
                correlationId
            );
            return;
        }

        if (
            typeof parsedHandoff !== "object" ||
            parsedHandoff === null ||
            !("nonce" in parsedHandoff) ||
            typeof parsedHandoff.nonce !== "string" ||
            !("resourceServer" in parsedHandoff) ||
            typeof parsedHandoff.resourceServer !== "string" ||
            !("state" in parsedHandoff) ||
            typeof parsedHandoff.state !== "string" ||
            !("correlationId" in parsedHandoff) ||
            typeof parsedHandoff.correlationId !== "string" ||
            !("expiresAt" in parsedHandoff) ||
            typeof parsedHandoff.expiresAt !== "number"
        ) {
            return;
        }
        const handoff = parsedHandoff as DpopNonceRedirectHandoff;

        if (
            handoff.expiresAt < Date.now() ||
            handoff.state !== state ||
            handoff.correlationId !== correlationId ||
            handoff.resourceServer !==
                canonicalizeDpopResourceServer(
                    resourceRequestUri,
                    correlationId
                )
        ) {
            return;
        }

        this.setResourceServerNonce(
            handoff.resourceServer,
            handoff.nonce,
            correlationId
        );
    }

    clearRedirectHandoff(correlationId: string = ""): void {
        if (typeof window === "undefined") {
            return;
        }

        try {
            window.sessionStorage.removeItem(this.redirectHandoffCacheKey);
        } catch {
            this.performanceClient?.incrementFields(
                { "ext.dpopNonceRedirectHandoffClearFailureCount": 1 },
                correlationId
            );
            this.logger?.warning(
                "Unable to clear the DPoP nonce redirect handoff.",
                correlationId
            );
            // No in-memory state is affected when session storage is unavailable.
        }
    }

    clear(): void {
        this.resourceServerNonces.clear();
        this.clearRedirectHandoff();
    }
}
