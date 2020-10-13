import * as Mocha from "mocha";
import { expect } from "chai";
import { ServerTelemetryManager, CacheManager, AuthError, ServerTelemetryRequest, ServerTelemetryEntity, AccountEntity, CredentialEntity, AppMetadataEntity, ThrottlingEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, CredentialType, ValidCredentialType, StringUtils } from "../../src";
import { TEST_CONFIG } from "../utils/StringConstants";
import sinon from "sinon";

let store = {};
class TestCacheManager extends CacheManager {
    // Accounts
    getAccount(key: string): AccountEntity | null {
        const account: AccountEntity = store[key] as AccountEntity;
        if (AccountEntity.isAccountEntity(account)) {
            return account;
        }
        return null;
    }
    setAccount(key: string, value: AccountEntity): void {
        store[key] = value;
    }

    // Credentials (idtokens, accesstokens, refreshtokens)
    getCredential(key: string): ValidCredentialType | null {
        const credType = CredentialEntity.getCredentialType(key);
        switch (credType) {
            case CredentialType.ID_TOKEN:
                return store[key] as IdTokenEntity;
            case CredentialType.ACCESS_TOKEN:
                return store[key] as AccessTokenEntity;
            case CredentialType.REFRESH_TOKEN:
                return store[key] as RefreshTokenEntity;
        }
        return null;
    }
    setCredential(key: string, value: CredentialEntity): void {
        store[key] = value;
    }

    // AppMetadata
    getAppMetadata(key: string): AppMetadataEntity | null {
        return store[key] as AppMetadataEntity;
    }
    setAppMetadata(key: string, value: AppMetadataEntity): void {
        store[key] = value;
    }

    // Telemetry cache
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        const serverTelemetryEntity: ServerTelemetryEntity = store[key] as ServerTelemetryEntity;
        if (ServerTelemetryEntity.isServerTelemetryEntity(key, serverTelemetryEntity)) {
            return serverTelemetryEntity;
        }
        return null;
    }
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        store[key] = value;
    }

    // Throttling cache
    getThrottlingCache(key: string): ThrottlingEntity | null {
        return store[key] as ThrottlingEntity;
    }
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        store[key] = value;
    }

    removeItem(key: string): boolean {
        let result: boolean = false;
        if (!!store[key]) {
            delete store[key];
            result = true;
        }
        return result;
    }
    containsKey(key: string): boolean {
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

            const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
            expect(cacheValue).to.deep.eq(failures);
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
            testCacheManager.setServerTelemetry(cacheKey, failures);

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
            testCacheManager.setServerTelemetry(cacheKey, failures);

            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            const lastHeaderVal = telemetryManager.generateLastRequestHeaderValue();
            expect(lastHeaderVal).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId},${testApiCode},${testCorrelationId}|${testError},${testError}|2,0`);
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
            expect(lastHeaderVal).to.eq(`2|${testCacheHits}|${testApiCode},${testCorrelationId}|${testError}|2,1`);
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

            expect(testCacheManager.getServerTelemetry(cacheKey)).to.deep.eq(failures);
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.clearTelemetryCache();
            expect(testCacheManager.getServerTelemetry(cacheKey)).to.be.undefined;
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

            expect(testCacheManager.getServerTelemetry(cacheKey)).to.deep.eq(failures);
            const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
            telemetryManager.clearTelemetryCache();
            expect(testCacheManager.getServerTelemetry(cacheKey)).to.deep.eq(expectedCacheEntry);
        });
    });

    it("maxErrorsToSend returns a number smaller than length of error array when size limit reached", () => {
        const failures = {
            failedRequests: [],
            errors: [],
            cacheHits: 0
        };

        let dataSize = 0;
        while (dataSize < 4000) {
            failures.failedRequests.push(testApiCode, testCorrelationId);
            failures.errors.push(testError);
            dataSize += testApiCode.toString().length + testCorrelationId.toString().length + testError.length;
        }
        // Add a couple more to go over max size
        failures.failedRequests.push(testApiCode, testCorrelationId);
        failures.errors.push(testError);
        failures.failedRequests.push(testApiCode, testCorrelationId);
        failures.errors.push(testError);

        expect(ServerTelemetryManager.maxErrorsToSend(failures)).to.be.lessThan(failures.errors.length);
    });

    it("incrementCacheHits", () => {
        const initialCacheValue = new ServerTelemetryEntity();
        initialCacheValue.cacheHits = 1;
        testCacheManager.setServerTelemetry(cacheKey, initialCacheValue);
        const telemetryManager = new ServerTelemetryManager(testTelemetryPayload, testCacheManager);
        telemetryManager.incrementCacheHits();

        const cacheValue = testCacheManager.getServerTelemetry(cacheKey) as ServerTelemetryEntity;
        console.log("cacheValue", cacheValue);
        expect(cacheValue.cacheHits).to.eq(2);
    });
});
