/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { validateAgeAssuranceTargets } from "../../src/response/AgeAssurance.js";
import { ageAssuranceTargetMismatch } from "../../src/error/ClientAuthErrorCodes.js";
import { RequestParameterBuilder } from "../../src/index.js";

const claims = (targets: string[], token = "id_token") =>
    JSON.stringify({
        [token]: {
            xms_agvs: {
                essential: true,
                additionalProperties: ["interrupt-if-not-verified", ...targets],
            },
        },
    });

describe("age-assurance target binding", () => {
    it.each(["+mc,-sm", "-SM,+MC"])(
        "matches exact identities independently of outcome and order: %s",
        (receipt) => {
            expect(() =>
                validateAgeAssuranceTargets(
                    claims(["target-mc", "target-sm"]),
                    { xms_agvt: receipt },
                    "correlation"
                )
            ).not.toThrow();
        }
    );

    it.each([
        undefined,
        null,
        0,
        ["+mc", "-sm"],
        "",
        "mc,sm",
        "+mc",
        "+mc,+sm,+other",
        "+mc,+mc",
        "+mc,-MC",
        "+mc,",
        "+mc,,+sm",
        "++mc,+sm",
        "+, +sm",
        "+mc, -sm",
        "+mc,+sm ",
        "+all",
    ])(
        "rejects malformed or nonmatching receipt %j, including TU",
        (receipt) => {
            expect(() =>
                validateAgeAssuranceTargets(
                    claims(["target-mc", "target-sm"]),
                    { xms_agvs: 0, xms_agvt: receipt },
                    "correlation"
                )
            ).toThrow(
                expect.objectContaining({
                    errorCode: ageAssuranceTargetMismatch,
                    correlationId: "correlation",
                })
            );
        }
    );

    it("treats all literally and permits future target identities", () => {
        validateAgeAssuranceTargets(
            claims(["target-all"]),
            { xms_agvt: "-ALL" },
            ""
        );
        validateAgeAssuranceTargets(
            claims(["TARGET-future_target-1", "target-FUTURE_TARGET-1"]),
            { xms_agvt: "+future_target-1" },
            ""
        );
        expect(() =>
            validateAgeAssuranceTargets(
                claims(["target-all"]),
                { xms_agvt: "+mc,+sm" },
                ""
            )
        ).toThrow();
    });

    it.each([
        undefined,
        "{}",
        claims([]),
        claims(["target-mc"], "access_token"),
    ])("does not opt in without explicit ID-token targets: %s", (request) => {
        expect(() =>
            validateAgeAssuranceTargets(request, undefined, "")
        ).not.toThrow();
    });

    it("keeps request expectations independent across calls", () => {
        validateAgeAssuranceTargets(
            claims(["target-mc"]),
            { xms_agvt: "-mc" },
            "one"
        );
        expect(() =>
            validateAgeAssuranceTargets(
                claims(["target-sm"]),
                { xms_agvt: "-mc" },
                "two"
            )
        ).toThrow();
        validateAgeAssuranceTargets(
            claims(["target-mc"]),
            { xms_agvt: "+mc" },
            "one"
        );
    });

    it("preserves additionalProperties when merging client capabilities", () => {
        const request = claims(["target-mc"]);
        const merged = RequestParameterBuilder.buildMergedClaims(request, [
            "CP1",
        ]);
        expect(JSON.parse(merged!).id_token.xms_agvs).toEqual(
            JSON.parse(request).id_token.xms_agvs
        );
        expect(JSON.parse(merged!).access_token.xms_cc.values).toContain("CP1");
    });
});
