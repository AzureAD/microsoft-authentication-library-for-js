import {
    buildDpopResourceRequestContext,
    DpopProofGenerator,
} from "../../src/crypto/DpopProof.js";
import { mockCrypto } from "../client/ClientTestUtils.js";
import * as TimeUtils from "../../src/utils/TimeUtils.js";
import * as ClientConfigurationErrorCodes from "../../src/error/ClientConfigurationErrorCodes.js";
import { ClientConfigurationError } from "../../src/error/ClientConfigurationError.js";

describe("DpopProof primitives", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("normalizes resource request context", () => {
        const context = buildDpopResourceRequestContext(
            "get",
            "HTTPS://graph.microsoft.com/v1.0/me?test=true",
            "test-correlation-id"
        );

        expect(context.normalizedMethod).toBe("GET");
        expect(context.normalizedUri).toBe(
            "https://graph.microsoft.com/v1.0/me?test=true"
        );
    });

    it("throws deterministic errors when DPoP resource context is missing", () => {
        expect(() =>
            buildDpopResourceRequestContext(
                undefined,
                "https://graph.microsoft.com/v1.0/me",
                "test-correlation-id"
            )
        ).toThrow(
            new ClientConfigurationError(
                ClientConfigurationErrorCodes.missingDpopResourceRequestMethod,
                "test-correlation-id"
            )
        );

        expect(() =>
            buildDpopResourceRequestContext(
                "GET",
                undefined,
                "test-correlation-id"
            )
        ).toThrow(
            new ClientConfigurationError(
                ClientConfigurationErrorCodes.missingDpopResourceRequestUri,
                "test-correlation-id"
            )
        );
    });

    it("generates token proof claims with required DPoP fields", () => {
        const guid = "test-jti";
        const now = 1700000000;
        jest.spyOn(TimeUtils, "nowSeconds").mockReturnValue(now);
        jest.spyOn(mockCrypto, "createNewGuid").mockReturnValue(guid);

        const generator = new DpopProofGenerator(mockCrypto);
        const context = buildDpopResourceRequestContext(
            "GET",
            "https://graph.microsoft.com/v1.0/me",
            "test-correlation-id"
        );
        const proof = generator.generateTokenProof("ES256", { kty: "EC" }, context);

        expect(proof.header).toEqual({
            typ: "dpop+jwt",
            alg: "ES256",
            jwk: { kty: "EC" },
        });
        expect(proof.claims).toEqual({
            jti: guid,
            htm: "GET",
            htu: context.normalizedUri,
            iat: now,
        });
    });

    it("generates ath for resource proofs", async () => {
        jest.spyOn(mockCrypto, "createNewGuid").mockReturnValue("test-jti");
        jest.spyOn(mockCrypto, "hashString").mockResolvedValue("test-ath");

        const generator = new DpopProofGenerator(mockCrypto);
        const context = buildDpopResourceRequestContext(
            "GET",
            "https://graph.microsoft.com/v1.0/me",
            "test-correlation-id"
        );
        const proof = await generator.generateResourceProof(
            "ES256",
            { kty: "EC" },
            context,
            "access-token"
        );

        expect(proof.claims.ath).toBe("test-ath");
    });
});
