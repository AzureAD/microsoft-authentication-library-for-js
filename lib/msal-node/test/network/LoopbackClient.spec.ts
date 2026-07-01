/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { LoopbackClient } from "../../src/network/LoopbackClient.js";

describe("LoopbackClient", () => {
    let loopbackClient: LoopbackClient;

    afterEach(() => {
        loopbackClient?.closeServer();
    });

    describe("listenForAuthCode", () => {
        it("handles GET with valid auth code (query response_mode)", async () => {
            loopbackClient = new LoopbackClient();
            const responsePromise = loopbackClient.listenForAuthCode();

            // Wait for server to start listening
            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            // Simulate AAD redirect with code in query string
            await makeRequest(
                Number(port),
                "GET",
                "/?code=test_auth_code&state=test_state"
            );

            const response = await responsePromise;
            expect(response.code).toBe("test_auth_code");
            expect(response.state).toBe("test_state");
        });

        it("handles POST with valid auth code (form_post response_mode)", async () => {
            loopbackClient = new LoopbackClient();
            const responsePromise = loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            // Simulate form_post from AAD
            await makeRequest(
                Number(port),
                "POST",
                "/",
                "code=test_auth_code&state=test_state",
                "application/x-www-form-urlencoded"
            );

            const response = await responsePromise;
            expect(response.code).toBe("test_auth_code");
            expect(response.state).toBe("test_state");
        });

        it("handles POST with error response", async () => {
            loopbackClient = new LoopbackClient();
            const responsePromise = loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            await makeRequest(
                Number(port),
                "POST",
                "/",
                "error=access_denied&error_description=user_cancelled",
                "application/x-www-form-urlencoded"
            );

            const response = await responsePromise;
            expect(response.error).toBe("access_denied");
            expect(response.error_description).toBe("user_cancelled");
        });

        it("returns 415 for POST with wrong Content-Type", async () => {
            loopbackClient = new LoopbackClient();
            loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            const statusCode = await makeRequest(
                Number(port),
                "POST",
                "/",
                '{"code":"test"}',
                "application/json"
            );

            expect(statusCode).toBe(415);
        });

        it("returns 405 for non-GET/POST methods", async () => {
            loopbackClient = new LoopbackClient();
            loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            const statusCode = await makeRequest(
                Number(port),
                "PUT",
                "/"
            );

            expect(statusCode).toBe(405);
        });

        it("does not resolve promise for requests without OAuth params", async () => {
            loopbackClient = new LoopbackClient();
            const responsePromise = loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            // Request without code or error (e.g., favicon)
            await makeRequest(Number(port), "GET", "/favicon.ico");

            // Now send a valid request to resolve the promise
            await makeRequest(
                Number(port),
                "GET",
                "/?code=real_code&state=real_state"
            );

            const response = await responsePromise;
            expect(response.code).toBe("real_code");
        });

        it("does not resolve promise for POST without OAuth params", async () => {
            loopbackClient = new LoopbackClient();
            const responsePromise = loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            // POST without code/error
            await makeRequest(
                Number(port),
                "POST",
                "/",
                "random_param=value",
                "application/x-www-form-urlencoded"
            );

            // Resolve with valid POST
            await makeRequest(
                Number(port),
                "POST",
                "/",
                "code=real_code&state=real_state",
                "application/x-www-form-urlencoded"
            );

            const response = await responsePromise;
            expect(response.code).toBe("real_code");
        });

        it("still handles GET after redirect (backward compat)", async () => {
            loopbackClient = new LoopbackClient();
            const responsePromise = loopbackClient.listenForAuthCode(
                "Custom success!"
            );

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            const port = new URL(redirectUri).port;

            // First: GET with code triggers 302 redirect
            await makeRequest(
                Number(port),
                "GET",
                "/?code=abc&state=xyz"
            );

            await responsePromise;

            // Second: GET to root returns success template
            const result = await makeRequestWithBody(
                Number(port),
                "GET",
                "/"
            );
            expect(result.body).toBe("Custom success!");
        });
    });

    describe("preferredPort", () => {
        it("listens on preferred port when available", async () => {
            const preferredPort = 49876; // Unlikely to be in use
            loopbackClient = new LoopbackClient(preferredPort);
            loopbackClient.listenForAuthCode();

            await waitForServerReady(loopbackClient);
            const redirectUri = loopbackClient.getRedirectUri();
            expect(redirectUri).toBe(
                `http://localhost:${preferredPort}`
            );
        });

        it("falls back to random port when preferred port is unavailable", async () => {
            // Occupy the preferred port first
            const preferredPort = 49877;
            const blocker = http.createServer();
            await new Promise<void>((resolve) => {
                blocker.listen(preferredPort, "127.0.0.1", () => resolve());
            });

            try {
                loopbackClient = new LoopbackClient(preferredPort);
                loopbackClient.listenForAuthCode();

                await waitForServerReady(loopbackClient);
                const redirectUri = loopbackClient.getRedirectUri();
                const port = new URL(redirectUri).port;

                // Should have fallen back to a different port
                expect(Number(port)).not.toBe(preferredPort);
            } finally {
                blocker.close();
            }
        });
    });
});

/**
 * Helper: wait for the loopback server to start listening
 */
async function waitForServerReady(
    client: LoopbackClient,
    maxWait = 2000
): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        try {
            client.getRedirectUri();
            return;
        } catch {
            await new Promise((r) => setTimeout(r, 10));
        }
    }
    throw new Error("Loopback server did not start in time");
}

/**
 * Helper: make an HTTP request and return the status code
 */
function makeRequest(
    port: number,
    method: string,
    path: string,
    body?: string,
    contentType?: string
): Promise<number> {
    return new Promise((resolve, reject) => {
        const options: http.RequestOptions = {
            hostname: "127.0.0.1",
            port,
            path,
            method,
            headers: contentType ? { "content-type": contentType } : {},
        };

        const req = http.request(options, (res) => {
            res.resume(); // Consume response data
            res.on("end", () => resolve(res.statusCode || 0));
        });

        req.on("error", reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

/**
 * Helper: make an HTTP request and return status + body
 */
function makeRequestWithBody(
    port: number,
    method: string,
    path: string,
    body?: string,
    contentType?: string
): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
        const options: http.RequestOptions = {
            hostname: "127.0.0.1",
            port,
            path,
            method,
            headers: contentType ? { "content-type": contentType } : {},
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () =>
                resolve({ statusCode: res.statusCode || 0, body: data })
            );
        });

        req.on("error", reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}
