import { expect } from "chai";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig, TelemetryPlatform } from "../../src/telemetry/TelemetryTypes";
import TelemetryEvent from "../../src/telemetry/TelemetryEvent";
import { Constants, Logger, ICrypto, PkceCodes } from "../../src";

const TEST_CLIENT_ID = "client-id";
const TEST_PLATFORM: TelemetryPlatform = {
    applicationName: "testApp",
    applicationVersion: "12.0.1",
    sdk: "javascript",
    sdkVersion: "10.00"
};

class TestCrypto implements ICrypto {
    createNewGuid(): string {
        return "guid";
    }
    base64Encode(input: string): string {
        return "encoded-string";
    }
    base64Decode(input: string): string {
        return "decoded-string";
    }
    async generatePkceCodes(): Promise<PkceCodes> {
        return {
            verifier: "verifier",
            challenge: "challenge"
        }
    }
}

const testCryptoInstance = new TestCrypto();

describe("TelemetryManager", () => {

    it("TelemetryManager constructs", () => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            TEST_PLATFORM,
            () => console.log,
            new Logger({}),
            testCryptoInstance
        );
    });

    it("TelemetryManager - TelemetryEvent can be created, add an event, and get it", done => {
        const config: TelemetryConfig = {
            clientId: TEST_CLIENT_ID,
            platform: TEST_PLATFORM,
            onlySendFailureTelemetry: false
        };
        const correlationId = "correlation-id";
        const eventHandler = (events: Array<object>) => {
            expect(events).to.have.length(2);
            expect(events[0]['msal.event_name']).to.eq("fakeEvent");
            expect(events[1]['msal.event_name']).to.eq("msal.default_event");
            expect(events[0]['Microsoft.MSAL.correlation_id']).to.eq(correlationId);
            expect(events[0]['Microsoft.MSAL.correlation_id']).to.eq(events[1]['Microsoft.MSAL.correlation_id']);
            done();
        };
        const telemetryManager: TelemetryManager = new TelemetryManager(
            config,
            TEST_PLATFORM,
            eventHandler,
            new Logger({}),
            testCryptoInstance
        );
        const event: TelemetryEvent = new TelemetryEvent(
            "event-id",
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
        const correlationId = "correlation-id";
        const eventHandler = (events: Array<object>) => {
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
            TEST_PLATFORM,
            eventHandler,
            new Logger({}),
            testCryptoInstance
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "event-id",
            "fakeEvent",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "event-id2",
            "fakeEvent2",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "event-id3",
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
        const correlationId = "correlation-id";
        const eventHandler = (events: Array<object>) => {
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
            TEST_PLATFORM,
            eventHandler,
            new Logger({}),
            testCryptoInstance
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "event-id1",
            "fakeEvent",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "event-id2",
            "fakeEvent2",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "event-id3",
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
        const correlationId = "correlation-id";
        let calledOnce = false;
        const eventHandler = (events: Array<object>) => {
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
            TEST_PLATFORM,
            eventHandler,
            new Logger({}),
            testCryptoInstance
        );
        const event1: TelemetryEvent = new TelemetryEvent(
            "event-id1",
            "fakeEvent",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event1);
        const event2: TelemetryEvent = new TelemetryEvent(
            "event-id2",
            "fakeEvent2",
            correlationId,
            "FakeEvent"
        );
        telemetryManager.startEvent(event2);
        const event3: TelemetryEvent = new TelemetryEvent(
            "event-id3",
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

    describe("createAndStartApiEvent", () => {
        it("scrubs pii from url", () => {
            const config: TelemetryConfig = {
                clientId: TEST_CLIENT_ID,
                platform: TEST_PLATFORM,
                onlySendFailureTelemetry: false
            };

            const correlationId = "correlation-id";
            let calledOnce = false;

            const fakeUrl = "https://login.microsoftonline.com/Abc-123/I-am-a-tenant/orange";
            const scrubbedUrl = "https://login.microsoftonline.com/abc-123/<tenant>/orange";

            const eventHandler = (events: Array<object>) => {
                // if calledOnce is already true we shouldnt ever get back to this callback.
                expect(calledOnce).to.be.false;
                expect(events).to.have.length(2);
                expect(events[0]['msal.url']).to.eq(scrubbedUrl.toLowerCase());
                calledOnce = true;
            };

            const telemetryManager: TelemetryManager = new TelemetryManager(
                config,
                TEST_PLATFORM,
                eventHandler,
                new Logger({
                    piiLoggingEnabled: false
                }),
                testCryptoInstance
            );

            const testEvent = telemetryManager.createAndStartHttpEvent(correlationId, "GET", fakeUrl, "test-event");
            telemetryManager.stopEvent(testEvent);
            telemetryManager.flush(correlationId);
        });
    });

    it("Gets a stubbed Telemetry Manager", () => {
        const manager: TelemetryManager = TelemetryManager.getTelemetrymanagerStub(TEST_CLIENT_ID, new Logger({}), testCryptoInstance);
        // @ts-ignore
        expect(manager.telemetryPlatform.applicationName).to.eq("UnSetStub");
        // @ts-ignore
        expect(manager.telemetryPlatform.sdk).to.eq(Constants.libraryName);
    });
    it("if we decide that we want to get orphaned events even if there are no completed, implement that and add test here");
    it("gets the correct event counts of ui, http, cache");
});
