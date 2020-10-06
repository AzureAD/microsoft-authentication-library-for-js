import * as Mocha from "mocha";
import { expect } from "chai";
import { ServerTelemetryManager, CacheManager, AuthError, ServerTelemetryRequest, ServerTelemetryEntity } from "../../src";
import { TEST_CONFIG } from "../utils/StringConstants";

let store = {};
class TestCacheManager extends CacheManager {
    setItem(key: string, value: string | object, type?: string): void {
        store[key] = JSON.stringify(value) as string;
    }
    getItem(key: string, type?: string): string | object {
        const value = store[key];
        if (value) {
            const serverTelemetryEntity: ServerTelemetryEntity = new ServerTelemetryEntity();
            return (CacheManager.toObject(serverTelemetryEntity, JSON.parse(value)) as ServerTelemetryEntity);
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
};

describe("ServerTelemetryManager.ts", () => {
    afterEach(() => {
        store = {};
    });

    describe("cacheFailedRequest", () => {
        it("Caches error", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));

            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: [testError],
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).to.deep.eq(failures);
        });

        it("Adds error if a previous error already exists in cache", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError));

            const failures = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryEntity;
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
            const testPayload: ServerTelemetryRequest = {...testTelemetryPayload, forceRefresh: true };
            const telemetryManager = new ServerTelemetryManager(testPayload, testCacheManager);
            const currHeaderVal = telemetryManager.generateCurrentRequestHeaderValue();
            expect(currHeaderVal).to.eq(`2|${testApiCode},1|`);
        });

        it("Adds telemetry headers with last failed request", () => {
            const testCacheHits = 3;
            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: [testError],
                cacheHits: testCacheHits
            };
            store[cacheKey] = JSON.stringify(failures);

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|1,0`);
        });

        it("Adds telemetry headers with multiple last failed requests", () => {
            const testCacheHits = 3;
            const failures = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                cacheHits: testCacheHits
            };
            store[cacheKey] = JSON.stringify(failures);

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId},${testApiCode},${testCorrelationId}|${testError},${testError}|2,0`);
        });
    });

    it("incrementCacheHits", () => {
        const initialCacheValue = {
            failedRequests: [],
            errors: [],
            cacheHits: 1
        };
        store[cacheKey] = JSON.stringify(initialCacheValue);
        const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
        telemetryManager.incrementCacheHits();

        const cacheValue = testCacheManager.getItem(cacheKey) as ServerTelemetryEntity;
        expect(cacheValue.cacheHits).to.eq(2);
    });
});
