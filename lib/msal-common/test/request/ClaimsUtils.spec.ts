/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    hasClaimsChallenge,
    mergeClientCapabilities,
    supportsCae,
    shouldSkipBrokerClaims,
} from "../../src/request/ClaimsUtils.js";
import { getAccessTokenCacheKeyComponents } from "../../src/cache/utils/CacheHelpers.js";

describe("Capability claims", () => {
    it.each([
        [{ skipBrokerClaims: true, embeddedClientId: "app" }, true],
        [
            {
                skipBrokerClaims: true,
                extraParameters: { brk_client_id: "app" },
            },
            true,
        ],
        [
            { skipBrokerClaims: true, extraParameters: { brk_client_id: "" } },
            false,
        ],
        [{ skipBrokerClaims: false, embeddedClientId: "app" }, false],
        [{ skipBrokerClaims: true }, false],
    ])("matches the outgoing broker skip policy: %j", (request, skipped) => {
        expect(shouldSkipBrokerClaims(request)).toBe(skipped);
    });
    const cp1 = JSON.stringify({
        access_token: { xms_cc: { values: ["CP1"] } },
    });

    it.each([
        [undefined, false],
        ["{}", false],
        [cp1, false],
        [
            JSON.stringify({ access_token: { xms_cc: { values: ["cp1"] } } }),
            false,
        ],
        [
            JSON.stringify({
                access_token: { xms_cc: { values: ["CP1", "other"] } },
            }),
            false,
        ],
        [
            JSON.stringify({
                access_token: { xms_cc: { values: ["CP1"], essential: true } },
            }),
            true,
        ],
        [
            JSON.stringify({
                access_token: { auth_time: { essential: true } },
            }),
            true,
        ],
        [
            JSON.stringify({ id_token: { auth_time: { essential: true } } }),
            true,
        ],
    ])(
        "classifies claims %s without changing challenge semantics",
        (claims, challenge) => {
            expect(hasClaimsChallenge(claims as string | undefined)).toBe(
                challenge
            );
        }
    );

    it("uses configured capability precedence and preserves other claims", () => {
        const requestClaims = JSON.stringify({
            access_token: {
                xms_cc: { values: ["other"] },
                auth_time: { essential: true },
            },
        });

        const merged = mergeClientCapabilities(requestClaims, ["CP1"]);
        expect(supportsCae(merged)).toBe(true);
        expect(hasClaimsChallenge(merged)).toBe(true);
        expect(JSON.parse(merged!).access_token.auth_time).toEqual({
            essential: true,
        });
        expect(JSON.parse(requestClaims).access_token.xms_cc.values).toEqual([
            "other",
        ]);
    });

    it("preserves capability-claim requirements and rejects malformed values instead of erasing them", () => {
        const claims =
            '{"access_token":{"xms_cc":{"values":["CP1"],"essential":true}}}';
        const merged = mergeClientCapabilities(claims, ["CP1"]);
        expect(hasClaimsChallenge(merged)).toBe(true);
        expect(JSON.parse(merged!).access_token.xms_cc.essential).toBe(true);
        expect(() =>
            mergeClientCapabilities(
                '{"access_token":{"xms_cc":{"values":[123]}}}',
                ["CP1"],
                "test"
            )
        ).toThrow(
            expect.objectContaining({
                errorCode: "invalid_claims",
                correlationId: "test",
            })
        );
    });

    it("applies client-originated claims before configuration capabilities", () => {
        const clientClaims = JSON.stringify({
            access_token: { xms_cc: { values: ["other"] } },
        });
        expect(
            supportsCae(mergeClientCapabilities(cp1, [], "", clientClaims))
        ).toBe(false);
        expect(
            supportsCae(mergeClientCapabilities(cp1, ["CP1"], "", clientClaims))
        ).toBe(true);
    });

    it("preserves independent components and prevents an explicit marker from overriding claims", () => {
        const components = {
            fmi_path: "agent-a",
            client_claims: "client-claims",
            clientCapabilities: "false",
        };
        expect(
            getAccessTokenCacheKeyComponents(
                {
                    claims: cp1,
                    correlationId: "test",
                    attributeTokens: ["zeta", "alpha"],
                },
                components
            )
        ).toEqual({
            attribute_tokens: "alpha zeta",
            fmi_path: "agent-a",
            client_claims: "client-claims",
            clientCapabilities: "true",
        });
        expect(components.clientCapabilities).toBe("false");
    });

    it.each(["secret-not-json", "null", "[]"])(
        "rejects malformed claims without disclosing them",
        (claims) => {
            expect(() => supportsCae(claims, "test")).toThrow(
                expect.objectContaining({
                    errorCode: "invalid_claims",
                    correlationId: "test",
                })
            );
        }
    );
});
