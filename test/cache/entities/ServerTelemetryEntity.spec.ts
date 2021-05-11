import { expect } from "chai";
import { ServerTelemetryEntity } from "../../../src/cache/entities/ServerTelemetryEntity";
import { SERVER_TELEM_CONSTANTS, Separators } from "../../../src/utils/Constants";
import { TEST_CONFIG } from "../../test_kit/StringConstants";

describe("ServerTelemetryEntity.ts Unit Tests", () => {

    const ServerTelemetryKey = SERVER_TELEM_CONSTANTS.CACHE_KEY + Separators.CACHE_KEY_SEPARATOR + TEST_CONFIG.MSAL_CLIENT_ID;
    it("Verify if an object is a ServerTelemetry Entity", () => {

        const serverTelemetryObject = {
            failedRequests: [999, "correlationId"],
            errors: ["testError"],
            errorCount: 1,
            cacheHits: 0
        };

        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey, serverTelemetryObject)).to.be.true;
    });

    it("Verify an object is not a ServerTelemetry Entity", () => {

        const missingCacheHits = {
            failedRequests: [999, "correlationId"],
            errors: ["testError"],
            errorCount: 1
        };

        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey, missingCacheHits)).to.be.false;

        const missingErrors = {
            failedRequests: [999, "correlationId"],
            errorCount: 1,
            cacheHits: 0
        };
        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey, missingErrors)).to.be.false;

        const missingFailedRequests = {
            errors: ["testError"],
            errorCount: 1,
            cacheHits: 0
        };
        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey, missingFailedRequests)).to.be.false;

        const noCommonValues = {
            testParam: "test"
        };
        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey, noCommonValues)).to.be.false;
    });

    it("Verify an object is a ServerTelemetry Entity only when cache key is passed", () => {

        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey)).to.be.true;
    });

    it("Verify an object is not a ServerTelemetry Entity only when cache key is passed", () => {

        const ServerTelemetryKey = Separators.CACHE_KEY_SEPARATOR + SERVER_TELEM_CONSTANTS.CACHE_KEY + TEST_CONFIG.MSAL_CLIENT_ID;
        expect(ServerTelemetryEntity.isServerTelemetryEntity(ServerTelemetryKey)).to.be.false;
    });

});
