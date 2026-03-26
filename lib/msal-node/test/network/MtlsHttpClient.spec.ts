/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// jest.mock is hoisted before imports so that MtlsHttpClient picks up the mock Agent
// and never calls the real OpenSSL constructor (which validates PEM data).
// request is also mocked here so the real Node.js HTTP stack is never invoked.
jest.mock("https", () => {
    const actual = jest.requireActual<typeof import("https")>("https");
    return {
        ...actual,
        Agent: jest.fn().mockImplementation(() => ({})),
        request: jest.fn(),
    };
});

import * as https from "https";
import * as http from "http";
import * as crypto from "crypto";
import { MtlsHttpClient } from "../../src/network/MtlsHttpClient.js";
import { ClientAuthErrorCodes } from "@azure/msal-common";

const TEST_CERT = "-----BEGIN CERTIFICATE-----\nMIIBmzCC...\n-----END CERTIFICATE-----";
const TEST_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIB...\n-----END PRIVATE KEY-----";
const TEST_URL = "https://eastus.mtlsauth.microsoft.com/tenant-id/oauth2/v2.0/token";

const MockAgent = https.Agent as jest.MockedClass<typeof https.Agent>;
const MockRequest = https.request as jest.MockedFunction<typeof https.request>;

function createMockRequest(): {
    on: jest.Mock;
    write: jest.Mock;
    end: jest.Mock;
    destroy: jest.Mock;
} {
    return {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
    };
}

function createMockResponse(statusCode: number) {
    const listeners: Record<string, Function[]> = {};
    return {
        statusCode,
        headers: { "content-type": "application/json" },
        setEncoding: jest.fn(),
        on: jest.fn((event: string, cb: Function) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(cb);
        }),
        emit(event: string, data?: unknown) {
            (listeners[event] || []).forEach((cb) => cb(data));
        },
    };
}

describe("MtlsHttpClient", () => {
    beforeEach(() => {
        MockAgent.mockClear();
        MockRequest.mockReset();
    });

    describe("constructor", () => {
        it("creates an instance with cert and key string", () => {
            const client = new MtlsHttpClient(TEST_CERT, TEST_KEY);
            expect(client).toBeInstanceOf(MtlsHttpClient);
            // Agent is created eagerly in the constructor
            expect(MockAgent).toHaveBeenCalledWith(
                expect.objectContaining({ cert: TEST_CERT, key: TEST_KEY })
            );
        });

        it("creates an instance with a KeyObject key", () => {
            const { privateKey: keyObject } = crypto.generateKeyPairSync("ec", {
                namedCurve: "P-256",
            });
            const client = new MtlsHttpClient(TEST_CERT, keyObject);
            expect(client).toBeInstanceOf(MtlsHttpClient);
            // KeyObject is passed directly to https.Agent (Node.js accepts it at runtime)
            expect(MockAgent).toHaveBeenCalledWith(
                expect.objectContaining({ cert: TEST_CERT, key: keyObject })
            );
        });
    });

    describe("sendPostRequestAsync", () => {
        it("passes cert and key to https.Agent (created once in constructor)", async () => {
            const mockResponse = createMockResponse(200);
            const mockReq = createMockRequest();

            MockRequest.mockImplementation(
                ((_opts: unknown, callback?: (res: http.IncomingMessage) => void) => {
                    if (callback) {
                        callback(mockResponse as unknown as http.IncomingMessage);
                        mockResponse.emit(
                            "data",
                            JSON.stringify({
                                access_token: "test_token",
                                token_type: "mtls_pop",
                                expires_in: 3600,
                            })
                        );
                        mockResponse.emit("end");
                    }
                    return mockReq as unknown as http.ClientRequest;
                }) as any
            );

            // Agent is created eagerly in the constructor
            const client = new MtlsHttpClient(TEST_CERT, TEST_KEY);
            expect(MockAgent).toHaveBeenCalledWith(
                expect.objectContaining({ cert: TEST_CERT, key: TEST_KEY })
            );

            const result = await client.sendPostRequestAsync(TEST_URL, {
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=utf-8",
                },
                body: "client_id=foo&scope=bar&grant_type=client_credentials&token_type=mtls_pop",
            });

            expect(MockRequest).toHaveBeenCalled();
            expect(result.status).toBe(200);
            expect((result.body as { access_token: string }).access_token).toBe(
                "test_token"
            );
        });

        it("rejects with network error on request error", async () => {
            const mockReq = {
                on: jest.fn((event: string, cb: Function) => {
                    if (event === "error") {
                        cb(new Error("ECONNREFUSED"));
                    }
                }),
                write: jest.fn(),
                end: jest.fn(),
                destroy: jest.fn(),
            };

            MockRequest.mockReturnValue(mockReq as unknown as http.ClientRequest);

            const client = new MtlsHttpClient(TEST_CERT, TEST_KEY);
            await expect(
                client.sendPostRequestAsync(TEST_URL, {})
            ).rejects.toThrow();
        });

        it("rejects with parse error when response body is not valid JSON", async () => {
            const mockResponse = {
                statusCode: 200,
                headers: {},
                setEncoding: jest.fn(),
                on: jest.fn((event: string, cb: Function) => {
                    if (event === "data") cb("not-valid-json");
                    if (event === "end") cb();
                }),
            };
            const mockReq = createMockRequest();

            MockRequest.mockImplementation(
                ((_opts: unknown, callback?: (res: http.IncomingMessage) => void) => {
                    if (callback) callback(mockResponse as unknown as http.IncomingMessage);
                    return mockReq as unknown as http.ClientRequest;
                }) as any
            );

            const client = new MtlsHttpClient(TEST_CERT, TEST_KEY);
            await expect(
                client.sendPostRequestAsync(TEST_URL, {})
            ).rejects.toMatchObject({
                errorCode: ClientAuthErrorCodes.tokenParsingError,
            });
        });
    });

    describe("sendGetRequestAsync", () => {
        it("sends a GET request with cert/key", async () => {
            const mockResponse = createMockResponse(200);
            const mockReq = createMockRequest();

            MockRequest.mockImplementation(
                ((_opts: unknown, callback?: (res: http.IncomingMessage) => void) => {
                    if (callback) {
                        callback(mockResponse as unknown as http.IncomingMessage);
                        mockResponse.emit("data", JSON.stringify({ ok: true }));
                        mockResponse.emit("end");
                    }
                    return mockReq as unknown as http.ClientRequest;
                }) as any
            );

            const client = new MtlsHttpClient(TEST_CERT, TEST_KEY);
            const result = await client.sendGetRequestAsync(TEST_URL);

            const callArgs = MockRequest.mock.calls[0][0];
            expect((callArgs as https.RequestOptions).method).toBe("GET");
            expect(result.status).toBe(200);
        });
    });
});
