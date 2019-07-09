import { expect } from "chai";
import TelemetryEvent from "../../src/telemetry/TelemetryEvent";
import { v4 as uuid } from "uuid";
import { idText } from "typescript";


describe("TelemetryEvent", () =>{
    it("constructed with correct params", () => {
        const correlationId = uuid();
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
        const correlationId = uuid();
        const eventName = "coolEvent";
        const telemetryEvent: TelemetryEvent = new TelemetryEvent(
            eventName,
            correlationId
        );
        setTimeout(() => {
            telemetryEvent.stop();
            const event = telemetryEvent.get();
            // greater than exact, //less than 100ms over
            expect(event['msal.elapsed_time']).to.be.greaterThan(time - 1);
            expect(event['msal.elapsed_time']).to.be.lessThan(time + 100);
            done();
        } , time);
    });
});