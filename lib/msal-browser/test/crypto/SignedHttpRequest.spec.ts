import { SignedHttpRequest } from "../../src/crypto/SignedHttpRequest.js";
import { createHash } from "crypto";
import { AuthToken } from "@azure/msal-common";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";

let mockDatabase = {
    "TestDB.keys": {},
};

describe("SignedHttpRequest.ts Unit Tests", () => {
    jest.setTimeout(30000);

    beforeEach(() => {
        jest.spyOn(window.crypto.subtle, "digest").mockImplementation(
            (): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256")
                        .update(Buffer.from("test-data"))
                        .digest()
                );
            }
        );

        // Mock DatabaseStorage
        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
            async () => {}
        );
        jest.spyOn(DatabaseStorage.prototype, "getItem").mockImplementation(
            async (kid: string) => {
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "setItem").mockImplementation(
            async (kid: string, payload: any) => {
                mockDatabase["TestDB.keys"][kid] = payload;
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "removeItem").mockImplementation(
            async (kid: string) => {
                delete mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "containsKey").mockImplementation(
            async (kid: string) => {
                return !!mockDatabase["TestDB.keys"][kid];
            }
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("generates expected kid", async () => {
        const shr: SignedHttpRequest = new SignedHttpRequest({
            resourceRequestUri: "https://consoto.com",
            resourceRequestMethod: "GET",
            correlationId: TEST_CONFIG.CORRELATION_ID,
        });
        const kid = await shr.generatePublicKeyThumbprint();
        expect(kid).toEqual("oYYABCL-q4VzKcaE6f6RQSsaXbCEEAs3qYz8lbYqqGc");
    });

    it("generates expected pop token", async () => {
        const payload = "jwt-payload";
        const nonce = "test-nonce";
        const ts = 123456;

        const shr: SignedHttpRequest = new SignedHttpRequest({
            resourceRequestUri: "https://consoto.com/path",
            resourceRequestMethod: "GET",
            correlationId: TEST_CONFIG.CORRELATION_ID,
        });
        const kid = await shr.generatePublicKeyThumbprint();

        const popToken = await shr.signRequest(payload, kid, {
            nonce,
            ts,
        });

        const decodedToken = AuthToken.extractTokenClaims(
            popToken,
            base64Decode,
            ""
        );

        expect(decodedToken.nonce).toEqual("test-nonce");
        expect(decodedToken.ts).toEqual(123456);
        expect(decodedToken.at).toEqual(payload);
        expect(decodedToken.u).toEqual("consoto.com");
        expect(decodedToken.p).toEqual("/path/");
        expect(decodedToken.m).toEqual("GET");
    });

    it("removes keys", async () => {
        const shr: SignedHttpRequest = new SignedHttpRequest({
            resourceRequestUri: "https://consoto.com/path",
            resourceRequestMethod: "GET",
            correlationId: TEST_CONFIG.CORRELATION_ID,
        });
        const kid = await shr.generatePublicKeyThumbprint();

        expect(mockDatabase["TestDB.keys"][kid]).toBeDefined();
        await shr.removeKeys(kid, TEST_CONFIG.CORRELATION_ID);
        expect(mockDatabase["TestDB.keys"][kid]).toBeUndefined();
    });
});
