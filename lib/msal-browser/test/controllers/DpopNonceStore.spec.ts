/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DpopNonceStore } from "../../src/controllers/DpopNonceStore.js";
import { ClientConfigurationErrorCodes } from "@azure/msal-common/browser";

describe("DpopNonceStore", () => {
    it("stores one nonce per normalized resource origin", () => {
        const store = new DpopNonceStore();

        store.setResourceServerNonce(
            "https://api.contoso.com:443/path?query=value",
            "nonce-1"
        );

        expect(
            store.getResourceServerNonce("https://API.CONTOSO.COM/other")
        ).toBe("nonce-1");
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
        ).toBe("nonce-3");
        expect(
            store.getResourceServerNonce("https://api.fabrikam.com/resource")
        ).toBe("nonce-2");
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
        ).toBe("nonce-1");
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
        ).toBe("nonce-50");
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
