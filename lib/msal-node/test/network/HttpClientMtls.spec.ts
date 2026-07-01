/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EventEmitter } from "events";
import https from "https";
import { HttpClient } from "../../src/network/HttpClient.js";
import { NetworkRequestOptions } from "@azure/msal-common";

jest.mock("https");

const mockedAgent = https.Agent as unknown as jest.Mock;
const mockedRequest = https.request as unknown as jest.Mock;

const mtlsUrl = "https://mtlsauth.microsoft.com/tenant-guid/oauth2/v2.0/token";

const mtlsResponseBody = {
    access_token: "mtls-access-token",
    token_type: "mtls_pop",
    expires_in: 3599,
};

const mtlsResponseHeaders = {
    "content-type": "application/json; charset=utf-8",
};

const mtlsOptions: NetworkRequestOptions = {
    headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: "client_id=clientId123&grant_type=client_credentials&token_type=mtls_pop",
    mtlsCertificate: {
        cert: "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n",
        key: "-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----\n",
    },
};

/**
 * Installs a mock `https.request` that returns a request emitter and, when `end()` is called,
 * delivers a response with the supplied status/body via the response callback.
 */
function mockHttpsRequest(
    statusCode: number,
    body: unknown,
    responseHeaders: Record<string, string | string[]> = mtlsResponseHeaders
): { requestOptions: () => https.RequestOptions; write: jest.Mock } {
    let capturedOptions: https.RequestOptions = {};
    const write = jest.fn();

    mockedRequest.mockImplementation(
        (options: https.RequestOptions, callback: (res: unknown) => void) => {
            capturedOptions = options;
            const req = new EventEmitter() as EventEmitter & {
                write: jest.Mock;
                end: jest.Mock;
            };
            req.write = write;
            req.end = jest.fn(() => {
                const res = new EventEmitter() as EventEmitter & {
                    headers: Record<string, string | string[]>;
                    statusCode: number;
                };
                res.headers = responseHeaders;
                res.statusCode = statusCode;
                callback(res);
                if (body !== undefined) {
                    res.emit("data", Buffer.from(JSON.stringify(body)));
                }
                res.emit("end");
            });
            return req;
        }
    );

    return { requestOptions: () => capturedOptions, write };
}

describe("HttpClient mTLS path", () => {
    let httpClient: HttpClient;

    beforeEach(() => {
        httpClient = new HttpClient();
        mockedAgent.mockClear();
        mockedRequest.mockClear();
    });

    it("routes POST through https.request when mtlsCertificate is present", async () => {
        mockHttpsRequest(200, mtlsResponseBody);

        const result = await httpClient.sendPostRequestAsync(
            mtlsUrl,
            mtlsOptions
        );

        expect(mockedRequest).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
        expect(result.body).toEqual(mtlsResponseBody);
    });

    it("configures the https.Agent with the binding certificate cert and key", async () => {
        mockHttpsRequest(200, mtlsResponseBody);

        await httpClient.sendPostRequestAsync(mtlsUrl, mtlsOptions);

        expect(mockedAgent).toHaveBeenCalledTimes(1);
        expect(mockedAgent).toHaveBeenCalledWith({
            cert: mtlsOptions.mtlsCertificate?.cert,
            key: mtlsOptions.mtlsCertificate?.key,
        });
    });

    it("derives hostname, port, and path from the target URL and sends the body", async () => {
        const handle = mockHttpsRequest(200, mtlsResponseBody);

        await httpClient.sendPostRequestAsync(mtlsUrl, mtlsOptions);

        const opts = handle.requestOptions();
        expect(opts.method).toBe("POST");
        expect(opts.hostname).toBe("mtlsauth.microsoft.com");
        expect(opts.path).toBe("/tenant-guid/oauth2/v2.0/token");
        // Custom headers preserved and Content-Length computed from the body.
        expect(opts.headers?.["Content-Type"]).toBe(
            "application/x-www-form-urlencoded;charset=utf-8"
        );
        expect(opts.headers?.["Content-Length"]).toBe(
            Buffer.byteLength(mtlsOptions.body ?? "")
        );
        expect(handle.write).toHaveBeenCalledWith(mtlsOptions.body);
    });

    it("normalizes array-valued response headers into a comma-joined string", async () => {
        mockHttpsRequest(200, mtlsResponseBody, {
            "content-type": "application/json",
            "set-cookie": ["a=1", "b=2"],
        });

        const result = await httpClient.sendPostRequestAsync(
            mtlsUrl,
            mtlsOptions
        );

        expect(result.headers["set-cookie"]).toBe("a=1, b=2");
    });

    it("does not use the mTLS path when no mtlsCertificate is supplied", async () => {
        // fetch is used by the non-mTLS path; stub it so this test does not hit the network.
        global.fetch = jest.fn().mockResolvedValue({
            status: 200,
            statusText: "OK",
            headers: new Headers(),
            json: jest.fn().mockResolvedValue(mtlsResponseBody),
        } as unknown as Response);

        await httpClient.sendPostRequestAsync(mtlsUrl, {
            headers: mtlsOptions.headers,
            body: mtlsOptions.body,
        });

        expect(mockedRequest).not.toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("rejects with a network error when the request emits an error", async () => {
        mockedRequest.mockImplementation(
            (
                _options: https.RequestOptions,
                _callback: (res: unknown) => void
            ) => {
                const req = new EventEmitter() as EventEmitter & {
                    write: jest.Mock;
                    end: jest.Mock;
                };
                req.write = jest.fn();
                req.end = jest.fn(() => {
                    req.emit("error", new Error("socket hang up"));
                });
                return req;
            }
        );

        await expect(
            httpClient.sendPostRequestAsync(mtlsUrl, mtlsOptions)
        ).rejects.toThrow(/socket hang up/);
    });

    it("rejects with a parsing error when the response body is not valid JSON", async () => {
        mockedRequest.mockImplementation(
            (
                _options: https.RequestOptions,
                callback: (res: unknown) => void
            ) => {
                const req = new EventEmitter() as EventEmitter & {
                    write: jest.Mock;
                    end: jest.Mock;
                };
                req.write = jest.fn();
                req.end = jest.fn(() => {
                    const res = new EventEmitter() as EventEmitter & {
                        headers: Record<string, string>;
                        statusCode: number;
                    };
                    res.headers = { "content-type": "text/html" };
                    res.statusCode = 200;
                    callback(res);
                    res.emit("data", Buffer.from("not-json"));
                    res.emit("end");
                });
                return req;
            }
        );

        await expect(
            httpClient.sendPostRequestAsync(mtlsUrl, mtlsOptions)
        ).rejects.toThrow(/Failed to parse response/);
    });
});
