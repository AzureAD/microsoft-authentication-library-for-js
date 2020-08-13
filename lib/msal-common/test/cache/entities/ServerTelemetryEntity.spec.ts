import { expect } from "chai";
import { ServerTelemetryEntity } from "../../../src/cache/entities/ServerTelemetryEntity";

describe("ServerTelemetryEntity.ts Unit Tests", () => {
    it("Verify if an object is a ServerTelemetry Entity", () => {
        const serverTelemetryObject = {
            failedRequests: [999, "correlationId"],
            errors: ["testError"],
            errorCount: 1,
            cacheHits: 0
        }

        expect(ServerTelemetryEntity.isServerTelemetryEntity(serverTelemetryObject)).to.be.true;
    });

    it("Verify an object is not a ServerTelemetry Entity", () => {
        const missingCacheHits = {
            failedRequests: [999, "correlationId"],
            errors: ["testError"],
            errorCount: 1
        }

        expect(ServerTelemetryEntity.isServerTelemetryEntity(missingCacheHits)).to.be.false;

        const missingErrorCount = {
            failedRequests: [999, "correlationId"],
            errors: ["testError"],
            cacheHits: 0
        }
        expect(ServerTelemetryEntity.isServerTelemetryEntity(missingErrorCount)).to.be.false;

        const missingErrors = {
            failedRequests: [999, "correlationId"],
            errorCount: 1,
            cacheHits: 0
        }
        expect(ServerTelemetryEntity.isServerTelemetryEntity(missingErrors)).to.be.false;

        const missingFailedRequests = {
            errors: ["testError"],
            errorCount: 1,
            cacheHits: 0
        }
        expect(ServerTelemetryEntity.isServerTelemetryEntity(missingFailedRequests)).to.be.false;

        const noCommonValues = {
            testParam: "test"
        }
        expect(ServerTelemetryEntity.isServerTelemetryEntity(noCommonValues)).to.be.false;
    });
});