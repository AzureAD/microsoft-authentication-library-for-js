/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { getRequestThumbprint } from "../../src/network/RequestThumbprint.js";
import { BaseAuthRequest } from "../../src/request/BaseAuthRequest.js";
import { TEST_CONFIG, RANDOM_TEST_GUID } from "../test_kit/StringConstants.js";

describe("RequestThumbprint.ts Unit Tests", () => {
    const baseRequest: BaseAuthRequest = {
        authority: TEST_CONFIG.validAuthority,
        correlationId: RANDOM_TEST_GUID,
        scopes: ["mcp.invoke"],
    };

    it("includes the resource value in the thumbprint", () => {
        const resource = "https://resource-a.example/mcp";
        const thumbprint = getRequestThumbprint(
            TEST_CONFIG.MSAL_CLIENT_ID,
            { ...baseRequest, resource },
            "uid.utid"
        );

        expect(thumbprint.resource).toBe(resource);
    });

    it("leaves resource undefined when not provided on the request", () => {
        const thumbprint = getRequestThumbprint(
            TEST_CONFIG.MSAL_CLIENT_ID,
            baseRequest,
            "uid.utid"
        );

        expect(thumbprint.resource).toBeUndefined();
    });

    it("produces distinct thumbprints for requests that differ only by resource (prevents MCP cross-resource dedup)", () => {
        const thumbprintA = getRequestThumbprint(
            TEST_CONFIG.MSAL_CLIENT_ID,
            { ...baseRequest, resource: "https://resource-a.example/mcp" },
            "uid.utid"
        );
        const thumbprintB = getRequestThumbprint(
            TEST_CONFIG.MSAL_CLIENT_ID,
            { ...baseRequest, resource: "https://resource-b.example/mcp" },
            "uid.utid"
        );

        // The deduplication key is the serialized thumbprint (see
        // StandardController.acquireTokenSilentDeduped). Differing resources
        // must not collide, otherwise a concurrent silent request for one MCP
        // resource could receive the token acquired for another.
        expect(JSON.stringify(thumbprintA)).not.toEqual(
            JSON.stringify(thumbprintB)
        );
    });

    it("produces identical thumbprints for requests with the same resource", () => {
        const resource = "https://resource-a.example/mcp";
        const thumbprintOne = getRequestThumbprint(
            TEST_CONFIG.MSAL_CLIENT_ID,
            { ...baseRequest, resource },
            "uid.utid"
        );
        const thumbprintTwo = getRequestThumbprint(
            TEST_CONFIG.MSAL_CLIENT_ID,
            { ...baseRequest, resource },
            "uid.utid"
        );

        expect(JSON.stringify(thumbprintOne)).toEqual(
            JSON.stringify(thumbprintTwo)
        );
    });
});
