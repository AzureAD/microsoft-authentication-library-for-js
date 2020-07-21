import * as Mocha from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ServerTelemetryManager, CacheManager, AuthError } from "../../src";
import { ServerTelemetryCacheValue } from "../../src/telemetry/server/ServerTelemetryCacheValue";

let store = {};
class TestCacheManager extends CacheManager {
    setItem(key: string, value: string | object, type?: string): void {
        store[key] = JSON.stringify(value) as string;
    }
    getItem(key: string, type?: string): string | object {
        console.log(key)
        console.log(store[key])
        const value = store[key]
        if (value) {
            return JSON.parse(value) as ServerTelemetryCacheValue;
        } else {
            return null;
        }
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
const cacheKey = "server-telemetry";

describe("ServerTelemetryManager.ts", () => {
    afterEach(() => {
        store = {};
    });

    describe("cacheFailedRequest", () => {
        it("Caches error", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));

            const failures: ServerTelemetryCacheValue = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: [testError],
                errorCount: 1,
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);
        });

        it("Adds error if a previous error already exists in cache", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));

            const failures: ServerTelemetryCacheValue = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                errorCount: 2,
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);
        });

        it("Removes oldest error from cache when limit has been reached", () => {
            // Error 1
            let telemetryManager = new ServerTelemetryManager(testCacheManager, 11111111, "this-will-be-removed");
            telemetryManager.cacheFailedRequest(new AuthError("thisErrorWillBeRemoved", "thisErrorWillBeRemoved"));
            let failures: ServerTelemetryCacheValue = {
                failedRequests: [11111111, "this-will-be-removed"],
                errors: ["thisErrorWillBeRemoved"],
                errorCount: 1,
                cacheHits: 0
            };
            let cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);

            // Error 2
            telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                failedRequests: [11111111, "this-will-be-removed", testApiCode, testCorrelationId],
                errors: ["thisErrorWillBeRemoved", testError],
                errorCount: 2,
                cacheHits: 0
            };
            cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);

            // Error 3
            telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                failedRequests: [11111111, "this-will-be-removed", testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: ["thisErrorWillBeRemoved", testError, testError],
                errorCount: 3,
                cacheHits: 0
            };
            cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);

            // Error 4 - Removes the first error
            telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError, testError],
                errorCount: 4,
                cacheHits: 0
            };
            cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);
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
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|0|||0`);
        });

        it("Adds telemetry headers with current request with forceRefresh true", () => {
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId, true);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},1|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|0|||0`);
        });

        it("Adds telemetry headers with last failed request", () => {
            const testCacheHits = 3;
            const failures: ServerTelemetryCacheValue = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: [testError],
                errorCount: 1,
                cacheHits: testCacheHits
            }
            store[cacheKey] = JSON.stringify(failures);
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},0|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|1`);
        });

        it("Adds telemetry headers with multiple last failed requests", () => {
            const testCacheHits = 3;
            const failures: ServerTelemetryCacheValue = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                errorCount: 2,
                cacheHits: testCacheHits
            }
            store[cacheKey] = JSON.stringify(failures);
            const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
            let headers: Map<string, string> = new Map();

            headers = telemetryManager.addTelemetryHeaders(headers);
            expect(headers.has(currentTelemetryHeader)).to.be.true;
            expect(headers.has(lastTelemetryHeader)).to.be.true;
            expect(headers.get(currentTelemetryHeader)).to.eq(`2|${testApiCode},0|`);
            expect(headers.get(lastTelemetryHeader)).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId},${testApiCode},${testCorrelationId}|${testError},${testError}|2`);
        });
    });

    it("incrementCacheHits", () => {
        const initialCacheValue = {
            failedRequests: [],
            errors: [],
            errorCount: 0,
            cacheHits: 1
        };
        store[cacheKey] = JSON.stringify(initialCacheValue);
        const telemetryManager = new ServerTelemetryManager(testCacheManager, testApiCode, testCorrelationId);
        telemetryManager.incrementCacheHits();

        const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
        expect(cacheValue.cacheHits).to.eq(2);
    });
});