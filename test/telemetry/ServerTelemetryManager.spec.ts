import * as Mocha from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ServerTelemetryManager, CacheManager, AuthError } from "../../src";

let store = {};
class TestCacheManager extends CacheManager {
    setItem(key: string, value: string | object, type?: string): void {
        store[key] = value as string;
    }
    getItem(key: string, type?: string): string | object {
        return store[key];
    }
    removeItem(key: string, type?: string): boolean {
        let result: boolean = false;
        if (!!store[key]) {
            delete store[key];
            result = true;
        }

        return result;
    }
    containsKey(key: string, type?: string): boolean {
        return !!store[key];
    }
    getKeys(): string[] {
        return Object.keys(store);
    }
    clear(): void {
        store = {};
    }
}
const testCacheManager = new TestCacheManager();
const testApiCode = 9999999;
const testError = "interaction_required";
const testCorrelationId = "this-is-a-test-correlationId";
const currentTelemetryHeader = "x-client-current-telemetry";
const lastTelemetryHeader = "x-client-last-telemetry";
const cacheHitsKey = "server-telemetry-cacheHits";
const failuresKey = "server-telemetry-failures";

describe("ServerTelemetryManager.ts", () => {
    afterEach(() => {
        store = {};
    });

    describe("cacheFailedRequest", () => {
        it("Caches error", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));

            const failures = {
                requests: [testApiCode, testCorrelationId],
                errors: [testError],
                count: 1
            };

            expect(store[failuresKey]).to.eq(JSON.stringify(failures));
        });

        it("Adds error if a previous error already exists in cache", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));

            const failures = {
                requests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                count: 2
            };

            expect(store[failuresKey]).to.eq(JSON.stringify(failures));
        });

        it("Removes oldest error from cache when limit has been reached", () => {
            // Error 1
            let telemetryManager = new ServerTelemetryManager(testCacheManager, 11111111, "this-will-be-removed");
            telemetryManager.cacheFailedRequest(new AuthError("thisErrorWillBeRemoved", "thisErrorWillBeRemoved"));
            let failures = {
                requests: [11111111, "this-will-be-removed"],
                errors: ["thisErrorWillBeRemoved"],
                count: 1
            };
            expect(store[failuresKey]).to.eq(JSON.stringify(failures));

            // Error 2
            telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                requests: [11111111, "this-will-be-removed", testApiCode, testCorrelationId],
                errors: ["thisErrorWillBeRemoved", testError],
                count: 2
            };
            expect(store[failuresKey]).to.eq(JSON.stringify(failures));

            // Error 3
            telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                requests: [11111111, "this-will-be-removed", testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: ["thisErrorWillBeRemoved", testError, testError],
                count: 3
            };
            expect(store[failuresKey]).to.eq(JSON.stringify(failures));

            // Error 4 - Removes the first error
            telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                requests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError, testError],
                count: 3
            };
            expect(store[failuresKey]).to.eq(JSON.stringify(failures));
        });
        
    });

    describe("addTelemetryHeaders", () => {
        it("Adds telemetry headers with current request", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},0|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|0|||`);
        });

        it("Adds telemetry headers with current request with forceRefresh true", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId, true);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},1|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|0|||`);
        });

        it("Adds telemetry headers with last failed request", () => {
            const testCacheHits = 3;
            store[cacheHitsKey] = testCacheHits.toString();
            const failures = {
                requests: [testApiCode, testCorrelationId],
                errors: [testError],
                count: 1
            }
            store[failuresKey] = JSON.stringify(failures);
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},0|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|`);
        });

        it("Adds telemetry headers with multiple last failed requests", () => {
            const testCacheHits = 3;
            store[cacheHitsKey] = testCacheHits.toString();
            const failures = {
                requests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                count: 2
            }
            store[failuresKey] = JSON.stringify(failures);
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},0|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId},${testApiCode},${testCorrelationId}|${testError},${testError}|`);
        });
    });

    it("incrementCacheHits", () => {
        store[cacheHitsKey] = "1";
        const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
        telemetryManager.incrementCacheHits();
        expect(store[cacheHitsKey]).to.eq("2");
    });
});