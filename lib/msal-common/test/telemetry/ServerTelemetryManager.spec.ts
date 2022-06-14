/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TEST_CONFIG } from "../test_kit/StringConstants";
import sinon from "sinon";
import { MockStorageClass, mockCrypto } from "../client/ClientTestUtils";
import { ServerTelemetryRequest } from "../../src/telemetry/server/ServerTelemetryRequest";
import { ServerTelemetryManager } from "../../src/telemetry/server/ServerTelemetryManager";
import { AuthError } from "../../src/error/AuthError";
import { ServerTelemetryEntity } from "../../src/cache/entities/ServerTelemetryEntity";
import { CacheOutcome } from "../../src/utils/Constants";

const testCacheManager = new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto);
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
        testCacheManager.store = {};
        sinon.restore();
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

            const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).toEqual(failures);
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

            const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).toEqual(failures);
        });

        it("Adds suberror if present on the error object", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.cacheFailedRequest(new AuthError(testError, testError, "sub_error"));

            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: ["sub_error"],
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).toEqual(failures);
        });

        it("Adds stringified error if not an AuthError", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            try {
                throw new Error("test_error");
            } catch (e) {
                telemetryManager.cacheFailedRequest(e);
            }

            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: ["Error: test_error"],
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).toEqual(failures);
        });

        it("Adds unknown error if error is empty or cannot be identified", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            try {
                throw "";
            } catch (e) {
                telemetryManager.cacheFailedRequest(e);
            }

            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: ["unknown_error"],
                cacheHits: 0
            };

            const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).toEqual(failures);
        });
    });

    describe("generate header values", () => {
        it("Adds telemetry headers with current request", () => {
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const currHeaderVal = telemetryManager.generateCurrentRequestHeaderValue();
            expect(currHeaderVal).toEqual(`5|${testApiCode},0,,,|,`);
        });

        it("Adds telemetry headers with current request with forceRefresh true", () => {
            const testPayload: ServerTelemetryRequest = {...testTelemetryPayload };
            const telemetryManager = new ServerTelemetryManager(testPayload, testCacheManager);
            telemetryManager.setCacheOutcome(CacheOutcome.FORCE_REFRESH);
            const currHeaderVal = telemetryManager.generateCurrentRequestHeaderValue();
            expect(currHeaderVal).toEqual(`5|${testApiCode},1,,,|,`);
        });

        it("Adds telemetry headers with last failed request", () => {
            const testCacheHits = 3;
            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: [testError],
                cacheHits: testCacheHits
            };
            testCacheManager.setServerTelemetry(cacheKey, failures);

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).toBe(`5|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|1,0`);
        });

        it("Adds telemetry headers with multiple last failed requests", () => {
            const testCacheHits = 3;
            const failures = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                cacheHits: testCacheHits
            };
            testCacheManager.setServerTelemetry(cacheKey, failures);

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).toBe(
                `5|${testCacheHits}|${testApiCode},${testCorrelationId},${testApiCode},${testCorrelationId}|${testError},${testError}|2,0`
            );
        });

        it("Adds partial telemetry data if max size is reached and sets overflow flag to 1", () => {
            sinon.stub(ServerTelemetryManager, "maxErrorsToSend").returns(1);
            const testCacheHits = 3;
            const failures = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                cacheHits: testCacheHits
            };
            testCacheManager.setServerTelemetry(cacheKey, failures);

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).toBe(`5|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|2,1`);
        });
    });

    describe("clear telemetry cache tests", () => {
        it("Removes telemetry cache entry if all errors were sent to server", () => {
            sinon.stub(ServerTelemetryManager, "maxErrorsToSend").returns(1);
            const failures = {
                failedRequests: [testApiCode, testCorrelationId],
                errors: [testError],
                cacheHits: 3
            };
            testCacheManager.setServerTelemetry(cacheKey, failures);

            expect(testCacheManager.getServerTelemetry(cacheKey)).toEqual(failures);
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.clearTelemetryCache();
            expect(testCacheManager.getServerTelemetry(cacheKey)).toBeUndefined();
        });

        it("Removes partial telemetry data from cache if partial data was sent to server", () => {
            sinon.stub(ServerTelemetryManager, "maxErrorsToSend").returns(1);
            const failures = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError, testError],
                cacheHits: 3
            };
            testCacheManager.setServerTelemetry(cacheKey, failures);

            const expectedCacheEntry = {
                failedRequests: [testApiCode, testCorrelationId, testApiCode, testCorrelationId],
                errors: [testError, testError],
                cacheHits: 0
            };

            expect(testCacheManager.getServerTelemetry(cacheKey)).toEqual(failures);
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.clearTelemetryCache();
            expect(testCacheManager.getServerTelemetry(cacheKey)).toEqual(expectedCacheEntry);
        });
    });

    describe("maxErrorsToSend tests", () => {
        it("maxErrorsToSend returns a number smaller than length of error array when size limit reached", () => {
            const failures = {
                failedRequests: [] as string[],
                errors: [] as string[],
                cacheHits: 0
            };
    
            let dataSize = 0;
            while (dataSize < 4000) {
                failures.failedRequests.push(`${testApiCode}`, testCorrelationId);
                failures.errors.push(`${testError}`);
                dataSize += testApiCode.toString().length + testCorrelationId.toString().length + testError.length;
            }
            // Add a couple more to go over max size
            failures.failedRequests.push(`${testApiCode}`, testCorrelationId);
            failures.errors.push(testError);
            failures.failedRequests.push(`${testApiCode}`, testCorrelationId);
            failures.errors.push(testError);
    
            expect(ServerTelemetryManager.maxErrorsToSend(failures)).toBeLessThan(failures.errors.length);
        });
    
        it("maxErrorsToSend doesn't break on null and undefined values", () => {
            const failures = {
                failedRequests: [null, undefined, undefined, null],
                errors: [null, undefined],
                cacheHits: 0
            };
    
            // @ts-ignore
            expect(ServerTelemetryManager.maxErrorsToSend(failures)).toBe(2);
        });
    });

    it("incrementCacheHits", () => {
        const initialCacheValue = new ServerTelemetryEntity();
        initialCacheValue.cacheHits = 1;
        testCacheManager.setServerTelemetry(cacheKey, initialCacheValue);
        const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
        telemetryManager.incrementCacheHits();

        const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
        expect(cacheValue.cacheHits).toBe(2);
    });
});
