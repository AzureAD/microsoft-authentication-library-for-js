/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IWebBrokerBridgeMessage,
    IWebBrokerBridgeResponse,
} from "../../src/webBrokerBridge/IWebBrokerBridgeMessage.js";
import { PendingRequestRegistry } from "../../src/webBrokerBridge/PendingRequestRegistry.js";

interface TestRequest extends IWebBrokerBridgeMessage {
    payload?: string;
}

interface TestResponse extends IWebBrokerBridgeResponse {
    result?: string;
}

function req(id: string, method = "TestMethod"): TestRequest {
    return { requestId: id, method };
}

function resp(id: string, result?: string): TestResponse {
    return { requestId: id, method: "TestMethod", result };
}

describe("PendingRequestRegistry", () => {
    describe("register / resolve", () => {
        it("resolves the awaiting promise with the response", async () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            const p = registry.register("r1");
            registry.resolve("r1", resp("r1", "ok"));
            await expect(p).resolves.toEqual(resp("r1", "ok"));
        });

        it("removes the entry once resolved", () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            void registry.register("r1");
            registry.resolve("r1", resp("r1"));
            expect(registry.has("r1")).toBe(false);
        });

        it("resolves in the order responses arrive, not the order requests registered", async () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            const p1 = registry.register("r1");
            const p2 = registry.register("r2");
            registry.resolve("r2", resp("r2", "second"));
            registry.resolve("r1", resp("r1", "first"));
            await expect(p2).resolves.toMatchObject({ result: "second" });
            await expect(p1).resolves.toMatchObject({ result: "first" });
        });
    });

    describe("reject", () => {
        it("rejects the awaiting promise with the reason", async () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            const p = registry.register("r1");
            const boom = new Error("boom");
            registry.reject("r1", boom);
            await expect(p).rejects.toBe(boom);
        });

        it("removes the entry once rejected", () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            void registry.register("r1").catch(() => undefined);
            registry.reject("r1", new Error("x"));
            expect(registry.has("r1")).toBe(false);
        });
    });

    describe("unmatched ids", () => {
        it("silently drops resolve() for an unknown requestId", () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            expect(() => registry.resolve("nope", resp("nope"))).not.toThrow();
        });

        it("silently drops reject() for an unknown requestId", () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            expect(() => registry.reject("nope", new Error("x"))).not.toThrow();
        });
    });

    describe("sendAndAwait", () => {
        it("invokes send synchronously with the message", async () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            const send = jest.fn<void, [TestRequest]>();
            const message = req("r1");

            const promise = registry.sendAndAwait(message, send);
            expect(send).toHaveBeenCalledWith(message);

            registry.resolve("r1", resp("r1", "ok"));
            await expect(promise).resolves.toMatchObject({ result: "ok" });
        });

        it("rejects and unregisters when send throws", async () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            const boom = new Error("transport failure");
            const send = jest.fn<void, [TestRequest]>(() => {
                throw boom;
            });

            const promise = registry.sendAndAwait(req("r1"), send);
            await expect(promise).rejects.toBe(boom);
            expect(registry.has("r1")).toBe(false);
        });

        it("supports concurrent requests correlated by requestId", async () => {
            const registry = new PendingRequestRegistry<TestResponse>();
            const send = jest.fn<void, [TestRequest]>();

            const p1 = registry.sendAndAwait(req("r1"), send);
            const p2 = registry.sendAndAwait(req("r2"), send);
            expect(send).toHaveBeenCalledTimes(2);

            registry.resolve("r1", resp("r1", "one"));
            registry.resolve("r2", resp("r2", "two"));

            await expect(p1).resolves.toMatchObject({ result: "one" });
            await expect(p2).resolves.toMatchObject({ result: "two" });
        });
    });
});
