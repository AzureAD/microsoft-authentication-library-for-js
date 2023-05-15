import DefaultEvent from "../../src/telemetry/DefaultEvent";
import { TelemetryPlatform, EventCount } from "../../src/telemetry/TelemetryTypes";
import { CryptoUtils } from '../../src/utils/CryptoUtils';

describe("DefaultEvent", () => {
    it("DefaultEvent constructs and carries expected  values", () => {
        const correlationId = CryptoUtils.createNewGuid();
        const clientId = CryptoUtils.createNewGuid();
        const eventCount: EventCount = {
            "msal.ui_event": 100,
            "msal.http_event": 200
        };
        const platformConfig: TelemetryPlatform =  {
            sdk: "javascript",
            sdkVersion: "1.0.0",
            applicationName: "mochaTest",
            applicationVersion: "1.22",
            networkInformation: {
                connectionSpeed: "4g"
            }
        }
        const defaultEvent: DefaultEvent = new DefaultEvent(
            platformConfig,
            correlationId,
            clientId,
            eventCount
        );
        const event = defaultEvent.get();
        expect(event["Microsoft_MSAL_ui_event_count"]).toBe(100);
        expect(event["Microsoft_MSAL_http_event_count"]).toBe(200);
        expect(event["Microsoft_MSAL_cache_event_count"]).toBe(0);
        expect(event["msal.application_name"]).toBe("mochaTest");
        expect(event["msal.event_name"]).toBe("msal.default_event");
        expect(event["msal.application_name"]).toBe("mochaTest");
        expect(event["msal.elapsed_time"]).toBe(-1);
        expect(event["msal.effective_connection_speed"]).toBe("4g");
    });
});
