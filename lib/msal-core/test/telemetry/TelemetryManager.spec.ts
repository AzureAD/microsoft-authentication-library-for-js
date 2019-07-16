import { expect } from "chai";
import { v4 as uuid } from "uuid";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig, TelemetryPlatform } from "../../src/telemetry/TelemetryTypes";
import TelemetryEvent from "../../src/telemetry/TelemetryEvent";

const TEST_CLIENT_ID = uuid();
const TEST_PLATFORM: TelemetryPlatform = {
    applicationName: "testApp",
    applicationVersion: "12.0.1",
    sdk: "javascript",
    sdkVersion: "10.00"
};
describe("TelemetryManager", () => {

    it("TelemetryManager constructs", () => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            () => console.log
        );
    });

    it("TelemetryManager - TelemetryEvent can be created, add an event, and get it", done => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const correlationId = uuid();
        const eventHandler = events => {
            expect(events).to.have.length(2);
            expect(events[0]['msal.event_name']).to.eq("fakeEvent");
            expect(events[1]['msal.event_name']).to.eq("msal.default_event");
            expect(events[0]['Microsoft.MSAL.correlation_id']).to.eq(correlationId);
            expect(events[0]['Microsoft.MSAL.correlation_id']).to.eq(events[1]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler
        );
        const event: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId
        );
        telemetryManager.startEvent(event);

        setTimeout(() => {
            telemetryManager.stopEvent(event);
            telemetryManager.flush(correlationId);
        }, 100);

    });
    it("TelemetryManager - TelemetryEvent can be created, add multiple events, and get them all", done => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const correlationId = uuid();
        const eventHandler = events => {
            expect(events).to.have.length(4);
            expect(events[0]['msal.event_name']).to.eq("fakeEvent");
            expect(events[1]['msal.event_name']).to.eq("fakeEvent2");
            expect(events[3]['msal.event_name']).to.eq("msal.default_event");
            expect(events[2]['Microsoft.MSAL.correlation_id']).to.eq(correlationId);
            expect(events[1]['Microsoft.MSAL.correlation_id']).to.eq(events[2]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId
        );
        telemetryManager.startEvent(event3);

        setTimeout(() => {
            telemetryManager.stopEvent(event1);
            telemetryManager.stopEvent(event2);
            telemetryManager.stopEvent(event3);
            telemetryManager.flush(correlationId);
        }, 100);

    });
    it("TelemetryManager - TelemetryEvent can be created, add multiple events, and get them even when all are not complete (orphaned events)", done => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const correlationId = uuid();
        const eventHandler = events => {
            expect(events).to.have.length(4);
            expect(events[0]['msal.event_name']).to.eq("fakeEvent");
            expect(events[1]['msal.event_name']).to.eq("fakeEvent2");
            expect(events[3]['msal.event_name']).to.eq("msal.default_event");
            expect(events[2]['Microsoft.MSAL.correlation_id']).to.eq(correlationId);
            expect(events[1]['Microsoft.MSAL.correlation_id']).to.eq(events[2]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId
        );
        telemetryManager.startEvent(event3);

        setTimeout(() => {
            telemetryManager.stopEvent(event1);
            telemetryManager.stopEvent(event2);
            telemetryManager.flush(correlationId);
        }, 100);

    });
    it("TelemetryManager - TelemetryEvent can be created, add multiple events, and get them even when all are not complete (orphaned events) - AND THEN try and call flush again to see if empty", done => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const correlationId = uuid();
        let calledOnce = false;
        const eventHandler = events => {
            // if calledOnce is already true we shouldnt ever get back to this callback.
            expect(calledOnce).to.be.false;
            expect(events).to.have.length(4);
            expect(events[0]['msal.event_name']).to.eq("fakeEvent");
            expect(events[1]['msal.event_name']).to.eq("fakeEvent2");
            expect(events[3]['msal.event_name']).to.eq("msal.default_event");
            expect(events[2]['Microsoft.MSAL.correlation_id']).to.eq(correlationId);
            expect(events[1]['Microsoft.MSAL.correlation_id']).to.eq(events[2]['Microsoft.MSAL.correlation_id']);
            calledOnce = true;
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId
        );
        telemetryManager.startEvent(event3);

        setTimeout(() => {
            telemetryManager.stopEvent(event1);
            telemetryManager.stopEvent(event2);
            telemetryManager.flush(correlationId);
            // call flush again
            setTimeout(() => {
                telemetryManager.flush(correlationId);
                // if we have not thrown yet then the right thing happened,
                // call done
                setTimeout(() => {
                    done();
                }, 100);
            }, 200)
        }, 100);

    });
    it("if we decide that we want to get orphaned events even if there are no completed, implement that and add test here");
    it("gets the correct event counts of ui, http, cache");
});
