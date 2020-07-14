import { expect } from "chai";
import sinon from "sinon";
import { ThrottlingUtils } from "../../src/network/ThrottlingUtils";
import { NetworkResponse } from "../../src/network/NetworkManager";
import { ServerAuthorizationTokenResponse } from "../../src/server/ServerAuthorizationTokenResponse";

describe.only("ThrottlingUtils", () => {
    describe("checkResponseForRetryAfter", () => {
        it("returns true when Retry-After header exists and when status <= 200", () => {
            const headers = new Map<string, string>();
            headers.set("Retry-After", "test");
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 199
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.true;
        });

        it("returns true when Retry-After header exists and when status > 300", () => {
            const headers = new Map<string, string>();
            headers.set("Retry-After", "test");
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 300
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.true;
        });

        it("returns false when there is no RetryAfter header", () => {
            const headers = new Map<string, string>();
            const res: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers,
                body: { },
                status: 301
            };

            const bool = ThrottlingUtils.checkResponseForRetryAfter(res);
            expect(bool).to.be.false;
        });

        it("returns false when 200 <= status < 300", () => {
            const headers = new Map<string, string>();
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
            sinon.stub(Date, "now").callsFake(() => 5000)
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
            expect(time1).to.be.deep.eq(65000);
            expect(time2).to.be.deep.eq(65000);
            expect(time3).to.be.deep.eq(65000);
        });

        it("calculates with the default MAX if given too large of a number", () => {
            const time = ThrottlingUtils.calculateThrottleTime(1000000000);
            expect(time).to.be.deep.eq(3605000);
        });
    });
});