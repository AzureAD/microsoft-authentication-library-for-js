import * as Mocha from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { ServerTelemetryManager, CacheManager, AuthError, ServerTelemetryRequest } from "../../src";
import { ServerTelemetryCacheValue } from "../../src/telemetry/server/ServerTelemetryCacheValue";
import { TEST_CONFIG } from "../utils/StringConstants";

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
const cacheKey = `server-telemetry-${TEST_CONFIG.MSAL_CLIENT_ID}`;

const testTelemetryPayload: ServerTelemetryRequest = {
    apiId: testApiCode,
    correlationId: testCorrelationId,
    clientId: TEST_CONFIG.MSAL_CLIENT_ID
}

describe("ServerTelemetryManager.ts", () => {
    afterEach(() => {
        store = {};
    });

    describe("cacheFailedRequest", () => {
        it("Caches error", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
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
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
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
            const firstPayload: ServerTelemetryRequest = {
                apiId: 11111111,
                correlationId: "this-will-be-removed",
                clientId: TEST_CONFIG.MSAL_CLIENT_ID
            }
            let telemetryManager = new ServerTelemetryManager(firstPayload, testCacheManager);
            telemetryManager.cacheFailedRequest(new AuthError("thisErrorWillBeRemoved", "thisErrorWillBeRemoved"));
            let failures: ServerTelemetryCacheValue = {
                failedRequests: [firstPayload.apiId, firstPayload.correlationId],
                errors: ["thisErrorWillBeRemoved"],
                errorCount: 1,
                cacheHits: 0
            };
            let cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);

            // Error 2
            telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                failedRequests: [firstPayload.apiId, firstPayload.correlationId, testApiCode, testCorrelationId],
                errors: ["thisErrorWillBeRemoved", testError],
                errorCount: 2,
                cacheHits: 0
            };
            cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);

            // Error 3
            telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            failures = {
                failedRequests: [firstPayload.apiId, firstPayload.correlationId, testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: ["thisErrorWillBeRemoved", testError, testError],
                errorCount: 3,
                cacheHits: 0
            };
            cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
            expect(cacheValue).to.deep.eq(failures);

            // Error 4 - Removes the first error
            telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
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

    describe("generate header values", () => {
        it("Adds telemetry headers with current request", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const currHeaderVal = telemetryManager.generateCurrentRequestHeaderValue();
            expect(currHeaderVal).to.eq(`2|${testApiCode},0|`);
        });

        it("Adds telemetry headers with current request with forceRefresh true", () => {
            const testPayload: ServerTelemetryRequest = {...testTelemetryPayload, forceRefresh: true }
            const telemetryManager = new ServerTelemetryManager(testPayload, testCacheManager);
            const currHeaderVal = telemetryManager.generateCurrentRequestHeaderValue();
            expect(currHeaderVal).to.eq(`2|${testApiCode},1|`);
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

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|1`);
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

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId},${testApiCode},${testCorrelationId}|${testError},${testError}|2`);
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
        const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
        telemetryManager.incrementCacheHits();

        const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryCacheValue;
        expect(cacheValue.cacheHits).to.eq(2);
    });
});