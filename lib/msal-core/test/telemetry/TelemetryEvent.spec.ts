import TelemetryEvent from "../../src/telemetry/TelemetryEvent";
import { CryptoUtils } from '../../src/utils/CryptoUtils';

describe("TelemetryEvent", () =>{
    it("constructed with correct params", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const eventName = "fakeEvent";
        const telemetryEvent: TelemetryEvent = new TelemetryEvent(
            eventName,
            correlationId,
            "FakeEvent"
        );
        expect(telemetryEvent.telemetryCorrelationId).toEqual(correlationId);
        expect(telemetryEvent.eventName).toEqual(eventName);
        expect(telemetryEvent.displayName).toEqual(`Msal-FakeEvent-${correlationId}`);
        expect(telemetryEvent.key).toBe(`${correlationId}_${telemetryEvent.get()["eventId"]}-${eventName}`);
    });

    it("stop event and get elapsed time", done => {
        const time = 500;
        const correlationId = CryptoUtils.createNewGuid();
        const eventName = "coolEvent";
        const telemetryEvent: TelemetryEvent = new TelemetryEvent(
            eventName,
            correlationId,
            "CoolEvent"
        );
        telemetryEvent.start();
        setTimeout(() => {
            telemetryEvent.stop();
            const event = telemetryEvent.get();
            // greater than exact, //less than 100ms over
            expect(event["msal.elapsed_time"]).toBeGreaterThan(time - 1);
            expect(event["msal.elapsed_time"]).toBeLessThan(time + 100);
            done();
        } , time);
    });
});
