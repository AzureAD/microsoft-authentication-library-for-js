/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import sinon from "sinon";
import { ThrottlingUtils } from "../../src/network/ThrottlingUtils";
import { RequestThumbprint } from "../../src/network/RequestThumbprint";
import { ThrottlingEntity } from "../../src/cache/entities/ThrottlingEntity";
import { NetworkResponse } from "../../src/network/NetworkManager";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse";
import { MockStorageClass }  from "../client/ClientTestUtils";
import { ServerError } from "../../src";
import { THUMBPRINT, THROTTLING_ENTITY, TEST_CONFIG } from "../test_kit/StringConstants";

describe("ThrottlingUtils", () => {
    describe("generateThrottlingStorageKey", () => {
        it("returns a throttling key", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const jsonString = JSON.stringify(thumbprint);
            const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint);

            expect(key).to.deep.eq(`throttling.${jsonString}`);
        });
    });

    describe("preProcess", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("checks the cache and throws an error", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const thumbprintValue: ThrottlingEntity = THROTTLING_ENTITY;
            const cache = new MockStorageClass();
            const removeItemStub = sinon.stub(cache, "removeItem");
            sinon.stub(cache, "getThrottlingCache").callsFake(() => thumbprintValue);
            sinon.stub(Date, "now").callsFake(() => 1);

            try {
                ThrottlingUtils.preProcess(cache, thumbprint);
            } catch { }
            sinon.assert.callCount(removeItemStub, 0);

            expect(() => ThrottlingUtils.preProcess(cache, thumbprint)).to.throw(ServerError);
        });

        it("checks the cache and removes an item", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const thumbprintValue: ThrottlingEntity = THROTTLING_ENTITY;
            const cache = new MockStorageClass();
            const removeItemStub = sinon.stub(cache, "removeItem");
            sinon.stub(cache, "getThrottlingCache").callsFake(() => thumbprintValue);
            sinon.stub(Date, "now").callsFake(() => 10);

            ThrottlingUtils.preProcess(cache, thumbprint);
            sinon.assert.callCount(removeItemStub, 1);

            expect(() => ThrottlingUtils.preProcess(cache, thumbprint)).to.not.throw;
        });

        it("checks the cache and does nothing with no match", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const cache = new MockStorageClass();
            const removeItemStub = sinon.stub(cache, "removeItem");
            sinon.stub(cache, "getThrottlingCache").callsFake(() => null);

            ThrottlingUtils.preProcess(cache, thumbprint);
            sinon.assert.callCount(removeItemStub, 0);

            expect(() => ThrottlingUtils.preProcess(cache, thumbprint)).to.not.throw;
        });
    });

    describe("postProcess", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("sets an item in the cache", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: { },
                body: { },
                status: 429
            };
            const cache = new MockStorageClass();
            const setItemStub = sinon.stub(cache, "setThrottlingCache");

            ThrottlingUtils.postProcess(cache, thumbprint, res);
            sinon.assert.callCount(setItemStub, 1);
        });

        it("does not set an item in the cache", () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: { },
                body: { },
                status: 200
            };
            const cache = new MockStorageClass();
            const setItemStub = sinon.stub(cache, "setThrottlingCache");

            ThrottlingUtils.postProcess(cache, thumbprint, res);
            sinon.assert.callCount(setItemStub, 0);
        });
    });

    describe("checkResponseStatus", () => {
        it("returns true if status == 429", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: { },
                body: { },
                status: 429
            };

            const bool = ThrottlingUtils.checkResponseStatus(res);
            expect(bool).to.be.true;
        });

        it("returns true if 500 <= status < 600", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: { },
                body: { },
                status: 500
            };

            const bool = ThrottlingUtils.checkResponseStatus(res);
            expect(bool).to.be.true;
        });

        it("returns false if status is not 429 or between 500 and 600", () => {
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: { },
                body: { },
                status: 430
            };

            const bool = ThrottlingUtils.checkResponseStatus(res);
            expect(bool).to.be.false;
        });
    });

    describe("checkResponseForRetryAfter", () => {
        it("returns true when Retry-After header exists and when status <= 200", () => {
            const headers: Record<string, string> = { };
            headers["Retry-After"] = "test";
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 199
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.true;
        });

        it("returns true when Retry-After header exists and when status > 300", () => {
            const headers: Record<string, string> = { };
            headers["Retry-After"] = "test";
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 300
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.true;
        });

        it("returns false when there is no RetryAfter header", () => {
            const headers: Record<string, string> = { };
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 301
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.false;
        });

        it("returns false when 200 <= status < 300", () => {
            const headers: Record<string, string> = { };
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 200
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.false;
        });
    });

    describe("calculateThrottleTime", () => {
        before(() => {
            sinon.stub(Date, "now").callsFake(() => 5000);
        });

        after(() => {
            sinon.restore();
        });

        it("returns calculated time to throttle", () => {
            const time = ThrottlingUtils.calculateThrottleTime(10);
            expect(time).to.be.deep.eq(15000);
        });

        it("calculates with the default time given a bad number", () => {
            const time1 = ThrottlingUtils.calculateThrottleTime(-1);
            const time2 = ThrottlingUtils.calculateThrottleTime(0);
            const time3 = ThrottlingUtils.calculateThrottleTime(null);

            // Based on Constants.DEFAULT_THROTTLE_TIME_SECONDS
            expect(time1).to.be.deep.eq(65000);
            expect(time2).to.be.deep.eq(65000);
            expect(time3).to.be.deep.eq(65000);
        });

        it("calculates with the default MAX if given too large of a number", () => {
            const time = ThrottlingUtils.calculateThrottleTime(1000000000);

            // Based on Constants.DEFAULT_MAX_THROTTLE_TIME_SECONDS
            expect(time).to.be.deep.eq(3605000);
        });
    });

    describe("removeThrottle", () =>  {
        after(() => {
            sinon.restore();
        });

        it("removes the entry from storage and returns true", () => {
            const cache = new MockStorageClass();
            const removeItemStub = sinon.stub(cache, "removeItem").returns(true);
            const clientId = TEST_CONFIG.MSAL_CLIENT_ID;
            const authority = TEST_CONFIG.validAuthority;
            const scopes = TEST_CONFIG.DEFAULT_SCOPES;

            const res = ThrottlingUtils.removeThrottle(cache, clientId, authority, scopes);

            sinon.assert.callCount(removeItemStub, 1);
            expect(res).to.be.true;
        });

        it("doesn't find an entry and returns false", () => {
            const cache = new MockStorageClass();
            const removeItemStub = sinon.stub(cache, "removeItem").returns(false);
            const clientId = TEST_CONFIG.MSAL_CLIENT_ID;
            const authority = TEST_CONFIG.validAuthority;
            const scopes = TEST_CONFIG.DEFAULT_SCOPES;

            const res = ThrottlingUtils.removeThrottle(cache, clientId, authority, scopes);

            sinon.assert.callCount(removeItemStub, 1);
            expect(res).to.be.false;
        });
    });
});
