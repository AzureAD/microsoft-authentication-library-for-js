import { expect } from "chai";
import { v4 as uuid } from "uuid";
import DefaultEvent from "../../src/telemetry/DefaultEvent";
import { TelemetryPlatform, EventCount } from "../../src/telemetry/TelemetryTypes";

describe("DefaultEvent", () => {
    it("DefaultEvent constructs and carries expected  values", () => {
        const correlationId = uuid();
        const clientId = uuid();
        const eventCount: EventCount = {
            'msal.ui_event': 100,
            'msal.http_event': 200
        };
        const platformConfig: TelemetryPlatform =  {
            sdk: "javascript",
            sdkVersion: "1.0.0",
            applicationName: "mochaTest",
            applicationVersion: "1.22"
        }
        const defaultEvent: DefaultEvent = new DefaultEvent(
            platformConfig,
            correlationId,
            clientId,
            eventCount
        );
        const event = defaultEvent.get();
        expect(event.Microsoft_MSAL_ui_event_count).to.eq(100);
        expect(event.Microsoft_MSAL_http_event_count).to.eq(200);
        expect(event.Microsoft_MSAL_cache_event_count).to.eq(0);
        expect(event['msal.application_name']).to.eq("mochaTest");
        expect(event['msal.event_name']).to.eq("msal.default_event");
        expect(event['msal.application_name']).to.eq("mochaTest");
        expect(event['msal.elapsed_time']).to.eq(-1);
    });
});
