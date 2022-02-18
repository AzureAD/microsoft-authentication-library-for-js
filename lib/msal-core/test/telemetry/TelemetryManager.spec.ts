import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig, TelemetryPlatform } from "../../src/telemetry/TelemetryTypes";
import TelemetryEvent from "../../src/telemetry/TelemetryEvent";
import { CryptoUtils } from '../../src/utils/CryptoUtils';
import { TEST_CONFIG } from "../TestConstants";
import { Constants, Logger } from "../../src";

const TEST_CLIENT_ID = CryptoUtils.createNewGuid();
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
            () => console.log,
            new Logger(() => {})
        );
    });

    it("TelemetryManager - TelemetryEvent can be created, add an event, and get it", done => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const correlationId = CryptoUtils.createNewGuid();
        const eventHandler = (events: Array<object>) => {
            expect(events).toHaveLength(2);
            expect(events[0]['msal.event_name']).toBe("fakeEvent");
            expect(events[1]['msal.event_name']).toBe("msal.default_event");
            expect(events[0]['Microsoft.MSAL.correlation_id']).toBe(correlationId);
            expect(events[0]['Microsoft.MSAL.correlation_id']).toBe(events[1]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler,
            new Logger(() => {})
        );
        const event: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId,
            "FakeEvent"
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
        const correlationId = CryptoUtils.createNewGuid();
        const eventHandler = (events: Array<object>) => {
            expect(events).toHaveLength(4);
            expect(events[0]['msal.event_name']).toBe("fakeEvent");
            expect(events[1]['msal.event_name']).toBe("fakeEvent2");
            expect(events[3]['msal.event_name']).toBe("msal.default_event");
            expect(events[2]['Microsoft.MSAL.correlation_id']).toBe(correlationId);
            expect(events[1]['Microsoft.MSAL.correlation_id']).toBe(events[2]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler,
            new Logger(() => {})
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId,
            "FakeEvent"
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
        const correlationId = CryptoUtils.createNewGuid();
        const eventHandler = (events: Array<object>) => {
            expect(events).toHaveLength(4);
            expect(events[0]['msal.event_name']).toBe("fakeEvent");
            expect(events[1]['msal.event_name']).toBe("fakeEvent2");
            expect(events[3]['msal.event_name']).toBe("msal.default_event");
            expect(events[2]['Microsoft.MSAL.correlation_id']).toBe(correlationId);
            expect(events[1]['Microsoft.MSAL.correlation_id']).toBe(events[2]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler,
            new Logger(() => {})
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId,
            "FakeEvent"
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
        const correlationId = CryptoUtils.createNewGuid();
        let calledOnce = false;
        const eventHandler = (events: Array<object>) => {
            // if calledOnce is already true we shouldnt ever get back to this callback.
            expect(calledOnce).toBe(false);
            expect(events).toHaveLength(4);
            expect(events[0]['msal.event_name']).toBe("fakeEvent");
            expect(events[1]['msal.event_name']).toBe("fakeEvent2");
            expect(events[3]['msal.event_name']).toBe("msal.default_event");
            expect(events[2]['Microsoft.MSAL.correlation_id']).toBe(correlationId);
            expect(events[1]['Microsoft.MSAL.correlation_id']).toBe(events[2]['Microsoft.MSAL.correlation_id']);
            calledOnce = true;
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            eventHandler,
            new Logger(() => {})
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "fakeEvent",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "fakeEvent2",
            correlationId,
            "FakeEvent"
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
    it("Gets a stubbed Telemetry Manager", () => {
        const manager: TelemetryManager = TelemetryManager.getTelemetrymanagerStub(TEST_CONFIG.MSAL_CLIENT_ID, new Logger(() => {}));
        // @ts-ignore
        expect(manager.telemetryPlatform.applicationName).toBe("UnSetStub");
        // @ts-ignore
        expect(manager.telemetryPlatform.sdk).toBe(Constants.libraryName);
    });
});
