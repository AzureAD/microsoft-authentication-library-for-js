/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as http from "http";
import { EventEmitter } from "events";
import { getPlatformMetadata } from "../src/ImdsClient";

jest.mock("http");

function makeResponse(
    statusCode: number,
    body: string
): http.IncomingMessage & EventEmitter {
    const res = Object.assign(new EventEmitter(), {
        statusCode,
    }) as unknown as http.IncomingMessage & EventEmitter;
    return res;
}

function makeRequest(): http.ClientRequest & EventEmitter {
    return Object.assign(new EventEmitter(), {
        end: jest.fn(),
        destroy: jest.fn(),
    }) as unknown as http.ClientRequest & EventEmitter;
}

describe("ImdsClient.getPlatformMetadata", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns parsed metadata on HTTP 200", async () => {
        const mockMetadata = {
            clientId: "client-id",
            tenantId: "tenant-id",
            cuId: "cu-id",
            attestationEndpoint: "https://attest.azure.net",
            mtlsAuthEndpoint: "https://eastus.mtlsauth.microsoft.com",
        };

        const req = makeRequest();
        const res = makeResponse(200, JSON.stringify(mockMetadata));

        (http.request as jest.Mock).mockImplementation(
            (_opts: unknown, cb: (res: http.IncomingMessage) => void) => {
                cb(res as http.IncomingMessage);
                return req;
            }
        );

        const p = getPlatformMetadata();

        // emit data + end to simulate response body
        res.emit("data", Buffer.from(JSON.stringify(mockMetadata)));
        res.emit("end");

        const result = await p;
        expect(result).toEqual(mockMetadata);
    });

    it("rejects on non-200 status", async () => {
        const req = makeRequest();
        const res = makeResponse(404, "Not Found");

        (http.request as jest.Mock).mockImplementation(
            (_opts: unknown, cb: (res: http.IncomingMessage) => void) => {
                cb(res as http.IncomingMessage);
                return req;
            }
        );

        const p = getPlatformMetadata();
        res.emit("data", Buffer.from("Not Found"));
        res.emit("end");

        await expect(p).rejects.toThrow("HTTP 404");
    });

    it("rejects on invalid JSON", async () => {
        const req = makeRequest();
        const res = makeResponse(200, "not-json");

        (http.request as jest.Mock).mockImplementation(
            (_opts: unknown, cb: (res: http.IncomingMessage) => void) => {
                cb(res as http.IncomingMessage);
                return req;
            }
        );

        const p = getPlatformMetadata();
        res.emit("data", Buffer.from("not-json"));
        res.emit("end");

        await expect(p).rejects.toThrow("parse");
    });

    it("uses cred-api-version=2.0 query parameter", async () => {
        const req = makeRequest();
        const res = makeResponse(200, JSON.stringify({
            clientId: "c", tenantId: "t", cuId: "cu",
        }));

        (http.request as jest.Mock).mockImplementation(
            (_opts: unknown, cb: (res: http.IncomingMessage) => void) => {
                cb(res as http.IncomingMessage);
                return req;
            }
        );

        const p = getPlatformMetadata();
        res.emit("data", Buffer.from(JSON.stringify({ clientId: "c", tenantId: "t", cuId: "cu" })));
        res.emit("end");
        await p;

        const opts = (http.request as jest.Mock).mock.calls[0][0] as { path: string };
        expect(opts.path).toContain("cred-api-version=2.0");
        expect(opts.path).not.toContain("api-version=2024");
    });

    it("rejects on timeout", async () => {
        const req = makeRequest();

        (http.request as jest.Mock).mockImplementation(() => req);

        const p = getPlatformMetadata(1000);
        req.emit("timeout");

        await expect(p).rejects.toThrow("timed out");
    });
});
