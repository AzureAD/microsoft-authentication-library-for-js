/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DpopNonceStore } from "../../src/controllers/DpopNonceStore.js";
import { ClientConfigurationErrorCodes } from "@azure/msal-common/browser";

describe("DpopNonceStore", () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("stores one nonce per normalized resource origin", () => {
        const store = new DpopNonceStore();

        store.setResourceServerNonce(
            "https://api.contoso.com:443/path?query=value",
            "nonce-1"
        );

        expect(
            store.getResourceServerNonce("https://API.CONTOSO.COM/other")
        ).toEqual({ nonce: "nonce-1", version: 1 });
        expect(
            store.getResourceServerNonce("https://api.fabrikam.com/path")
        ).toBeUndefined();
    });

    it("replaces the matching origin without affecting other origins", () => {
        const store = new DpopNonceStore();

        store.setResourceServerNonce("https://api.contoso.com/a", "nonce-1");
        store.setResourceServerNonce("https://api.fabrikam.com/a", "nonce-2");
        store.setResourceServerNonce("https://api.contoso.com/b", "nonce-3");

        expect(
            store.getResourceServerNonce("https://api.contoso.com/resource")
        ).toEqual({ nonce: "nonce-3", version: 3 });
        expect(
            store.getResourceServerNonce("https://api.fabrikam.com/resource")
        ).toEqual({ nonce: "nonce-2", version: 2 });
    });

    it("does not mutate existing state when validation fails", () => {
        const store = new DpopNonceStore();
        store.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );

        expect(() =>
            store.setResourceServerNonce(
                "https://api.contoso.com/resource",
                "\u0000invalid"
            )
        ).toThrow(
            expect.objectContaining({
                errorCode: ClientConfigurationErrorCodes.invalidDpopNonce,
            })
        );

        expect(
            store.getResourceServerNonce("https://api.contoso.com/resource")
        ).toEqual({ nonce: "nonce-1", version: 1 });
    });

    it("evicts the oldest origin after reaching capacity", () => {
        const store = new DpopNonceStore();

        for (let index = 0; index <= 50; index++) {
            store.setResourceServerNonce(
                `https://api-${index}.contoso.com/resource`,
                `nonce-${index}`
            );
        }

        expect(
            store.getResourceServerNonce("https://api-0.contoso.com/resource")
        ).toBeUndefined();
        expect(
            store.getResourceServerNonce("https://api-50.contoso.com/resource")
        ).toEqual({ nonce: "nonce-50", version: 51 });
    });

    it("assigns collision-resistant versions without changing unrelated origins", () => {
        const store = new DpopNonceStore();

        store.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );
        const first = store.getResourceServerNonce(
            "https://api.contoso.com/resource"
        );
        store.setResourceServerNonce(
            "https://api.fabrikam.com/resource",
            "other-nonce"
        );
        const unchanged = store.getResourceServerNonce(
            "https://api.contoso.com/resource"
        );
        store.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "nonce-2"
        );
        const second = store.getResourceServerNonce(
            "https://api.contoso.com/resource"
        );

        expect(first).toEqual({ nonce: "nonce-1", version: 1 });
        expect(unchanged).toEqual(first);
        expect(second).toEqual({ nonce: "nonce-2", version: 3 });
    });

    it("does not reuse a version when an evicted origin is added again", () => {
        const store = new DpopNonceStore();

        store.setResourceServerNonce(
            "https://api-0.contoso.com/resource",
            "nonce-0"
        );
        const firstVersion = store.getResourceServerNonce(
            "https://api-0.contoso.com/resource"
        )?.version;
        for (let i = 1; i <= 50; i++) {
            store.setResourceServerNonce(
                `https://api-${i}.contoso.com/resource`,
                `nonce-${i}`
            );
        }
        store.setResourceServerNonce(
            "https://api-0.contoso.com/resource",
            "replacement-nonce"
        );

        expect(firstVersion).toBe(1);
        expect(
            store.getResourceServerNonce("https://api-0.contoso.com/resource")
        ).toEqual({
            nonce: "replacement-nonce",
            version: 52,
        });
    });

    it("restores a matching redirect handoff once and deletes it immediately", () => {
        const sourceStore = new DpopNonceStore("client-id");
        sourceStore.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );
        sourceStore.saveRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        expect(window.sessionStorage.length).toBe(1);

        const restoredStore = new DpopNonceStore("client-id");
        restoredStore.restoreRedirectHandoff(
            "https://api.contoso.com/other",
            "request-state",
            "correlation-id"
        );

        expect(window.sessionStorage.length).toBe(0);
        expect(
            restoredStore.getResourceServerNonce(
                "https://api.contoso.com/resource"
            )
        ).toEqual({ nonce: "redirect-nonce", version: 1 });

        const secondStore = new DpopNonceStore("client-id");
        secondStore.restoreRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        expect(
            secondStore.getResourceServerNonce(
                "https://api.contoso.com/resource"
            )
        ).toBeUndefined();
    });

    it("deletes redirect handoff state without restoring on a binding mismatch", () => {
        const sourceStore = new DpopNonceStore("client-id");
        sourceStore.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );
        sourceStore.saveRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );

        const restoredStore = new DpopNonceStore("client-id");
        restoredStore.restoreRedirectHandoff(
            "https://api.contoso.com/resource",
            "different-state",
            "correlation-id"
        );

        expect(window.sessionStorage.length).toBe(0);
        expect(
            restoredStore.getResourceServerNonce(
                "https://api.contoso.com/resource"
            )
        ).toBeUndefined();
    });

    it("deletes an expired redirect handoff without restoring it", () => {
        const nowSpy = jest.spyOn(Date, "now");
        nowSpy.mockReturnValue(1000);
        const sourceStore = new DpopNonceStore("client-id");
        sourceStore.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "redirect-nonce"
        );
        sourceStore.saveRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );
        nowSpy.mockReturnValue(1000 + 5 * 60 * 1000 + 1);

        const restoredStore = new DpopNonceStore("client-id");
        restoredStore.restoreRedirectHandoff(
            "https://api.contoso.com/resource",
            "request-state",
            "correlation-id"
        );

        expect(window.sessionStorage.length).toBe(0);
        expect(
            restoredStore.getResourceServerNonce(
                "https://api.contoso.com/resource"
            )
        ).toBeUndefined();
    });

    it("clears all resource-server nonce state", () => {
        const store = new DpopNonceStore();
        store.setResourceServerNonce(
            "https://api.contoso.com/resource",
            "nonce-1"
        );

        store.clear();

        expect(
            store.getResourceServerNonce("https://api.contoso.com/resource")
        ).toBeUndefined();
    });
});
