import { expect } from "chai";
import TelemetryEvent from "../../src/telemetry/TelemetryEvent";
import { CryptoUtils } from '../../src/utils/CryptoUtils';

describe("TelemetryEvent", () =>{
    it("constructed with correct params", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const eventName = "fakeEvent";
        const telemetryEvent: TelemetryEvent = new TelemetryEvent(
            eventName,
            correlationId
        );
        expect(telemetryEvent.telemetryCorrelationId).to.eql(correlationId);
        expect(telemetryEvent.eventName).to.eql(eventName);
    });

    it("stop event and get elapsed time", done => {
        const time = 500;
        const correlationId = CryptoUtils.createNewGuid();
        const eventName = "coolEvent";
        const telemetryEvent: TelemetryEvent = new TelemetryEvent(
            eventName,
            correlationId
        );
        setTimeout(() => {
            telemetryEvent.stop();
            const event = telemetryEvent.get();
            // greater than exact, //less than 100ms over
            expect(event["msal.elapsed_time"]).to.be.greaterThan(time - 1);
            expect(event["msal.elapsed_time"]).to.be.lessThan(time + 100);
            done();
        } , time);
    });
});
