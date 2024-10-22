/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ApplicationTelemetry,
    IGuidGenerator,
    InteractionRequiredAuthError,
    IPerformanceClient,
    Logger,
    PerformanceEvents,
    PerformanceEventStatus,
    ServerError,
} from "../../src";
import crypto from "crypto";
import {
    compactStack,
    compactStackLine,
} from "../../src/telemetry/performance/PerformanceClient";
import * as PerformanceClient from "../../src/telemetry/performance/PerformanceClient";
import { PerformanceEventAbbreviations } from "../../src/telemetry/performance/PerformanceEvent";
import { AuthError } from "../../src/error/AuthError.js";

const sampleClientId = "test-client-id";
const authority = "https://login.microsoftonline.com/common";
const libraryName = "@azure/msal-common";
const libraryVersion = "1.0.0";
const samplePerfDuration = 50.25;
const sampleApplicationTelemetry: ApplicationTelemetry = {
    appName: "Test Comon App",
    appVersion: "1.0.0-test.1",
};

const logger = new Logger({
    loggerCallback: () => {},
});

class MockGuidGenerator implements IGuidGenerator {
    generateGuid(): string {
        return crypto["randomUUID"]();
    }
    isGuid(guid: string): boolean {
        return true;
    }
}

// @ts-ignore
export class MockPerformanceClient
    extends PerformanceClient.PerformanceClient
    implements IPerformanceClient
{
    private guidGenerator: MockGuidGenerator;

    constructor() {
        super(
            sampleClientId,
            authority,
            logger,
            libraryName,
            libraryVersion,
            sampleApplicationTelemetry
        );
        this.guidGenerator = new MockGuidGenerator();
    }

    generateId(): string {
        return this.guidGenerator.generateGuid();
    }

    setPreQueueTime(
        eventName: PerformanceEvents,
        correlationId?: string | undefined
    ): void {
        this.preQueueTimeByCorrelationId.set(correlationId || "", {
            name: eventName,
            time: 12345,
        });
    }

    getDurationMs(startTimeMs: number): number {
        return samplePerfDuration;
    }
}

describe("PerformanceClient.spec.ts", () => {
    afterEach(() => {
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    it("Adds and removes a callback", () => {
        const mockPerfClient = new MockPerformanceClient();

        const callbackId = mockPerfClient.addPerformanceCallback((events) => {
            console.log(events);
        });

        const result = mockPerfClient.removePerformanceCallback(callbackId);

        expect(result).toBe(true);
    });

    it("Does not register duplicate callbacks", () => {
        const mockPerfClient = new MockPerformanceClient();

        const callbackId = mockPerfClient.addPerformanceCallback((events) => {
            console.log(events);
        });

        const callbackId2 = mockPerfClient.addPerformanceCallback((events) => {
            console.log(events);
        });

        expect(callbackId).toEqual(callbackId2);
        // @ts-ignore
        expect(mockPerfClient.callbacks.size).toBe(1);
    });

    it("starts, ends, and emits an event", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].authority).toBe(authority);
            expect(events[0].durationMs).toBe(Math.floor(samplePerfDuration));
            expect(events[0].clientId).toBe(sampleClientId);
            expect(events[0].libraryName).toBe(libraryName);
            expect(events[0].libraryVersion).toBe(libraryVersion);
            expect(events[0].success).toBe(true);
            expect(events[0].appName).toBe(sampleApplicationTelemetry.appName);
            expect(events[0].appVersion).toBe(
                sampleApplicationTelemetry.appVersion
            );
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and end submeasurement
        const subMeasurement = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        subMeasurement.end({
            success: true,
        });

        topLevelEvent.end({
            success: true,
        });
    });

    it("adds fields", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        const authority = "test-authority";
        const extensionId = "test-extension-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].extensionId).toBe(extensionId);
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        topLevelEvent.add({
            httpVerAuthority: authority,
            extensionId: extensionId,
        });
        topLevelEvent.end({
            success: true,
        });
    });

    it("increments", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);

            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].visibilityChangeCount).toBe(8);
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        topLevelEvent.increment({ visibilityChangeCount: 5 });
        topLevelEvent.increment({ visibilityChangeCount: 3 });
        topLevelEvent.end({
            success: true,
        });
    });

    it("captures submeasurements", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event["acquireTokenSilentAsyncDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            expect(event["silentIframeClientAcquireTokenDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            expect(event.incompleteSubsCount).toEqual(0);
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.SilentIframeClientAcquireToken,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });

        // End top level event without ending submeasurement
        topLevelEvent.end({
            success: true,
        });
    });

    it("captures runtime errors from submeasurements", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        const publicError = new AuthError(
            "public_test_error",
            "This error will be thrown to caller"
        );
        const runtimeError = new TypeError("This error caused publicError");

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event["errorCode"]).toBe(publicError.errorCode);
            expect(event["errorName"]).toBe("TypeError");
            expect(event["errorStack"]).toEqual(
                compactStack(runtimeError.stack as string, 5)
            );
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            )
            .end({ success: false }, publicError);
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.SilentIframeClientAcquireToken,
                correlationId
            )
            .end({ success: false }, runtimeError);

        topLevelEvent.end(
            {
                success: false,
            },
            publicError
        );
    });

    it("captures runtime errors from submeasurements and removes error code", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        const publicError = new AuthError(
            "public_test_error",
            "This error will be thrown to caller"
        );
        const runtimeError = new TypeError("This error caused publicError");

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event["errorCode"]).toBeUndefined();
            expect(event["subErrorCode"]).toBeUndefined();
            expect(event["errorName"]).toBe("TypeError");
            expect(event["errorStack"]).toEqual(
                compactStack(runtimeError.stack as string, 5)
            );
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            )
            .end({ success: false }, publicError);
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.SilentIframeClientAcquireToken,
                correlationId
            )
            .end({ success: false }, runtimeError);

        topLevelEvent.end({
            success: true,
        });
    });

    it("discards incomplete submeasurements", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event["acquireTokenSilentAsyncDurationMs"]).toBeUndefined();
            expect(event["silentIframeClientAcquireTokenDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );
            expect(
                event["silentCacheClientAcquireTokenDurationMs"]
            ).toBeUndefined();
            expect(event.incompleteSubsCount).toEqual(2);
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start submeasurement but dont end it
        mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.SilentIframeClientAcquireToken,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });
        mockPerfClient.startMeasurement(
            PerformanceEvents.SilentCacheClientAcquireToken,
            correlationId
        );

        // End top level event without ending submeasurement
        topLevelEvent.end({
            success: true,
        });
    });

    it("only records the first measurement for a subMeasurement", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        const durationMs = 1;

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            const event = events[0];
            expect(events[0]["acquireTokenSilentAsyncDurationMs"]).toBe(
                Math.floor(durationMs)
            );
            expect(event.incompleteSubsCount).toEqual(0);
            expect(event.durationMs).toEqual(Math.floor(samplePerfDuration));
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        // Start and end submeasurements
        const subMeasure1 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        subMeasure1.end({
            success: true,
        });

        const subMeasure2 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilentAsync,
            correlationId
        );
        subMeasure2.end({
            success: true,
            durationMs: durationMs,
        });

        topLevelEvent.end({
            success: true,
        });
    });

    it("gracefully handles two requests with the same correlation id", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        let event1Id: string;

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].eventId).toBe(event1Id);
            expect(events[0].success).toBeFalsy();
            expect(events[0]["acquireTokenSilentDurationMs"]).toBe(
                Math.floor(samplePerfDuration)
            );

            done();
        });

        // Start and end top-level measurement
        const topLevelEvent1 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        event1Id = topLevelEvent1.event.eventId;
        const topLevelEvent2 = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        topLevelEvent2.end({
            success: true,
            startTimeMs: topLevelEvent1.event.startTimeMs + 5,
        });
        topLevelEvent1.end({
            success: false,
        });
    });

    it("truncates integral fields", (done) => {
        const mockPerfClient = new MockPerformanceClient();

        const correlationId = "test-correlation-id";
        const accessTokenSize = 12345.67;
        const refreshTokenSize = 23456.78;
        const idTokenSize = undefined;

        function isIntegral(val: number | undefined) {
            return val && Math.floor(val) === val;
        }

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(isIntegral(events[0].startTimeMs)).toBeTruthy();
            expect(isIntegral(events[0].durationMs)).toBeTruthy();
            expect(isIntegral(events[0].accessTokenSize)).toBeTruthy();
            expect(isIntegral(events[0].refreshTokenSize)).toBeTruthy();
            expect(isIntegral(events[0].idTokenSize)).toBeUndefined();

            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );
        topLevelEvent.add({
            accessTokenSize,
            refreshTokenSize,
            idTokenSize,
        });
        topLevelEvent.end({
            success: true,
        });
    });

    it("captures total count of manually completed queue events", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "test-correlation-id";

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toEqual(1);
            const event = events[0];
            expect(event.queuedCount).toEqual(4);
            expect(event.queuedManuallyCompletedCount).toEqual(2);
            expect(event.queuedTimeMs).toEqual(3);
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            correlationId
        );

        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.SilentCacheClientAcquireToken,
            topLevelEvent.event.correlationId,
            1,
            false
        );
        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenSilent,
            topLevelEvent.event.correlationId,
            2,
            false
        );
        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.AcquireTokenByRefreshToken,
            topLevelEvent.event.correlationId,
            3,
            true
        );
        mockPerfClient.addQueueMeasurement(
            PerformanceEvents.GetAuthCodeUrl,
            topLevelEvent.event.correlationId,
            4,
            true
        );

        topLevelEvent.end({
            success: true,
        });
    });

    describe("addError", () => {
        it("adds error", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new Error("Non-auth test error");

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.errorStack?.length).toEqual(5);
                expect(event.errorName).toEqual("Error");
                expect(
                    event.errorStack?.some((v) => v.includes("Test error"))
                ).toBeFalsy();
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            topLevelEvent.end(
                {
                    success: false,
                },
                error
            );
        });

        it("does not override error stack", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.errorStack?.length).toEqual(5);
                expect(event.errorName).toEqual("Error");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            PerformanceClient.addError(
                new Error("Test error"),
                logger,
                // @ts-ignore
                mockPerfClient.eventsByCorrelationId.get(correlationId)
            );
            const newError = new Error("Test error 2");
            newError.stack = "Test message\n at line1 \n at line 2";
            topLevelEvent.end(
                {
                    success: false,
                },
                newError
            );
        });

        it("captures server error no", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new ServerError(
                "test-error-code",
                undefined,
                undefined,
                "70011"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.serverErrorNo).toEqual(error.errorNo);
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            topLevelEvent.end(
                {
                    success: false,
                },
                error
            );
        });

        it("captures interaction required error no", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new InteractionRequiredAuthError(
                "test-error-code",
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                "70011"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.serverErrorNo).toEqual(error.errorNo);
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            topLevelEvent.end(
                {
                    success: false,
                },
                error
            );
        });
    });

    describe("compactStackTrace", () => {
        it("compacts error stack", () => {
            const error = new Error("test error");
            error.stack = "";
            for (let ix = 1; ix <= 20; ix++) {
                error.stack += `  at testFunction${ix} (microsoft-authentication-library-for-js/lib/msal-browser/testFile${ix}.js:10:1)\n`;
            }

            const result1 = compactStack(error.stack!, 3);
            expect(result1.length).toEqual(3);
            expect(result1).toEqual([
                "at testFunction2 (testFile2.js:10:1)",
                "at testFunction3 (testFile3.js:10:1)",
                "at testFunction4 (testFile4.js:10:1)",
            ]);

            expect(compactStack(error.stack!, -2)).toEqual([]);

            expect(
                compactStack(
                    "Test error message\n   at testFunction (microsoft-authentication-library-for-js/lib/msal-browser/testFile.js:10:1)",
                    3
                )
            ).toEqual(["at testFunction (testFile.js:10:1)"]);
        });

        it("Includes first line if it's a property read error", () => {
            let error: Error;
            try {
                // @ts-ignore
                error.test; // This will throw Cannot access property error
                throw new Error("This is unexpected");
            } catch (e) {
                error = e as Error;
            }

            const result1 = compactStack(error.stack!, 3);
            expect(result1.length).toEqual(3);
            expect(result1[0]).toEqual(
                "TypeError: Cannot read properties of undefined (reading 'test')"
            );
        });

        it("Includes first line if it's a property set error", () => {
            let error: Error;
            try {
                // @ts-ignore
                error.test = "test"; // This will throw Cannot access property error
                throw new Error("This is unexpected");
            } catch (e) {
                error = e as Error;
            }

            const result1 = compactStack(error.stack!, 3);
            expect(result1.length).toEqual(3);
            expect(result1[0]).toEqual(
                "TypeError: Cannot set properties of undefined (setting 'test')"
            );
        });

        it("Includes first line and redacts if it's a TypeError", () => {
            let error = new TypeError("Unable to access 'aribtrary field'");

            const result1 = compactStack(error.stack!, 1);
            expect(result1.length).toEqual(1);
            expect(result1[0]).toEqual(
                "TypeError: Unable to access <redacted>"
            );

            let error2 = new TypeError('Unable to access "aribtrary field"');

            const result2 = compactStack(error2.stack!, 1);
            expect(result2.length).toEqual(1);
            expect(result2[0]).toEqual(
                "TypeError: Unable to access <redacted>"
            );
        });

        it("Includes first line and redacts if it's a SyntaxError", () => {
            let error = new SyntaxError("Unable to access 'aribtrary field'");

            const result1 = compactStack(error.stack!, 1);
            expect(result1.length).toEqual(1);
            expect(result1[0]).toEqual(
                "SyntaxError: Unable to access <redacted>"
            );

            let error2 = new SyntaxError('Unable to access "aribtrary field"');

            const result2 = compactStack(error2.stack!, 1);
            expect(result2.length).toEqual(1);
            expect(result2[0]).toEqual(
                "SyntaxError: Unable to access <redacted>"
            );
        });

        it("handles empty error stack", () => {
            expect(compactStack("", 3)).toEqual([]);
        });

        it("handles error stack with a single error message", () => {
            expect(compactStack("Test error message", 3)).toEqual([]);
        });
    });

    describe("compactStackLine", () => {
        it("compacts stack line", () => {
            expect(
                compactStackLine(
                    "testFunction at (/microsoft-authentication-library-for-js/lib/msal-browser/app/PublicClientApplication.spec.ts:1234:56)"
                )
            ).toEqual(
                "testFunction at (PublicClientApplication.spec.ts:1234:56)"
            );

            expect(
                compactStackLine(
                    "testFunction at /microsoft-authentication-library-for-js/lib/msal-browser/app/PublicClientApplication.spec.ts:1234:56"
                )
            ).toEqual(
                "testFunction at (PublicClientApplication.spec.ts:1234:56)"
            );

            expect(
                compactStackLine(
                    "testFunction at (PublicClientApplication.spec.ts:1234:56)"
                )
            ).toEqual(
                "testFunction at (PublicClientApplication.spec.ts:1234:56)"
            );
        });

        it("compacts minified bundle stack line", () => {
            expect(
                compactStackLine(
                    "testFunction at (https://localhost/something/testMinified.jsbundle:1234:56)"
                )
            ).toEqual("testFunction at (testMinified.jsbundle:1234:56)");

            expect(
                compactStackLine(
                    "testFunction at (testMinified.jsbundle:1234:56)"
                )
            ).toEqual("testFunction at (testMinified.jsbundle:1234:56)");
        });
    });

    describe("calculateQueuedTime", () => {
        it("returns the queuedTime calculation", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(1, 2);
            expect(result).toBe(1);
        });

        it("returns 0 if preQueueTime is not positive integer", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(-1, 1);
            expect(result).toBe(0);
        });

        it("returns 0 if currentTime is not positive integer", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(1, -1);
            expect(result).toBe(0);
        });

        it("returns 0 if preQueueTime is greater than currentTime", () => {
            const mockPerfClient = new MockPerformanceClient();
            const result = mockPerfClient.calculateQueuedTime(2, 1);
            expect(result).toBe(0);
        });
    });

    describe("context", () => {
        const perfDuration = Math.round(samplePerfDuration);
        const abbrEventName = (name: string) => {
            return PerformanceEventAbbreviations.get(name) || name;
        };
        const correlationId = "test-correlation-id";

        it("captures successful single event", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            rootEvent.end({ success: true });
        });

        it("captures siblings with the same event name", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [abbrEventName(
                            PerformanceEvents.AcquireTokenSilentAsync
                        )]: {
                            dur: perfDuration,
                        },
                        [`${abbrEventName(
                            PerformanceEvents.AcquireTokenSilentAsync
                        )}_2`]: {
                            dur: perfDuration,
                        },
                        [`${abbrEventName(
                            PerformanceEvents.AcquireTokenSilentAsync
                        )}_3`]: {
                            dur: perfDuration,
                            [abbrEventName(thirdChildEventChild.event.name)]: {
                                dur: perfDuration,
                            },
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const firstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            );
            firstChildEvent.end({ success: true });

            const secondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            );
            secondChildEvent.end({ success: true });

            const thirdChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            );

            const thirdChildEventChild = mockPerfClient.startMeasurement(
                PerformanceEvents.AuthClientCreateQueryString,
                correlationId
            );
            thirdChildEventChild.end({ success: true });

            thirdChildEvent.end({ success: true });

            rootEvent.end({ success: true });
        });

        it("captures successful nested events", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [abbrEventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            [abbrEventName(
                                secondLevelFirstChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                            },
                            [abbrEventName(
                                secondLevelSecondChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                            },
                        },
                        [abbrEventName(firstLevelSecondChildEvent.event.name)]:
                            {
                                dur: perfDuration,
                            },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const firstLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.GetAuthCodeUrl,
                correlationId
            );

            const secondLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.HandleCodeResponseFromServer,
                correlationId
            );
            secondLevelFirstChildEvent.end({ success: true });

            const secondLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            secondLevelSecondChildEvent.end({ success: true });
            firstLevelFirstChildEvent.end({ success: true });

            const firstLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            firstLevelSecondChildEvent.end({ success: true });
            rootEvent.end({ success: true });
        });

        it("captures auth errors", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new AuthError(
                "test error code",
                "test error message",
                "test sub error code"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [abbrEventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            [abbrEventName(
                                secondLevelFirstChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                            },
                            [abbrEventName(
                                secondLevelSecondChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                                err: error.errorCode,
                                subErr: error.subError,
                                fail: 1,
                            },
                        },
                        [abbrEventName(firstLevelSecondChildEvent.event.name)]:
                            {
                                dur: perfDuration,
                            },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const firstLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.GetAuthCodeUrl,
                correlationId
            );

            const secondLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.HandleCodeResponseFromServer,
                correlationId
            );
            secondLevelFirstChildEvent.end({ success: true });

            const secondLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            secondLevelSecondChildEvent.end({ success: false }, error);
            firstLevelFirstChildEvent.end({ success: false }, error);

            const firstLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            firstLevelSecondChildEvent.end({ success: true });
            rootEvent.end({ success: true });
        });

        it("captures different auth errors", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new AuthError(
                "test error code",
                "test error message",
                "test sub error code"
            );
            const secondError = new AuthError(
                "test error code 2",
                "test error message 2",
                "test sub error code 2"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [abbrEventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            err: secondError.errorCode,
                            subErr: secondError.subError,
                            [abbrEventName(
                                secondLevelFirstChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                            },
                            [abbrEventName(
                                secondLevelSecondChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                                err: error.errorCode,
                                subErr: error.subError,
                                fail: 1,
                            },
                        },
                        [abbrEventName(firstLevelSecondChildEvent.event.name)]:
                            {
                                dur: perfDuration,
                            },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const firstLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.GetAuthCodeUrl,
                correlationId
            );

            const secondLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.HandleCodeResponseFromServer,
                correlationId
            );
            secondLevelFirstChildEvent.end({ success: true });

            const secondLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            secondLevelSecondChildEvent.end({ success: false }, error);
            firstLevelFirstChildEvent.end({ success: false }, secondError);

            const firstLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            firstLevelSecondChildEvent.end({ success: true });
            rootEvent.end({ success: true });
        });

        it("captures auth and non-auth errors", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new AuthError(
                "test error code",
                "test error message",
                "test sub error code"
            );
            const secondError = new TypeError("test type error");

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [abbrEventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            err: secondError.name,
                            [abbrEventName(
                                secondLevelFirstChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                            },
                            [abbrEventName(
                                secondLevelSecondChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                                err: error.errorCode,
                                subErr: error.subError,
                                fail: 1,
                            },
                        },
                        [abbrEventName(firstLevelSecondChildEvent.event.name)]:
                            {
                                dur: perfDuration,
                            },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const firstLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.GetAuthCodeUrl,
                correlationId
            );

            const secondLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.HandleCodeResponseFromServer,
                correlationId
            );
            secondLevelFirstChildEvent.end({ success: true });

            const secondLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            secondLevelSecondChildEvent.end({ success: false }, error);
            firstLevelFirstChildEvent.end({ success: false }, secondError);

            const firstLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            firstLevelSecondChildEvent.end({ success: true });
            rootEvent.end({ success: true });
        });

        it("captures non-auth errors", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new TypeError("test type error");

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [abbrEventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [abbrEventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            [abbrEventName(
                                secondLevelFirstChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                            },
                            [abbrEventName(
                                secondLevelSecondChildEvent.event.name
                            )]: {
                                dur: perfDuration,
                                err: error.name,
                                fail: 1,
                            },
                        },
                        [abbrEventName(firstLevelSecondChildEvent.event.name)]:
                            {
                                dur: perfDuration,
                            },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );

            const firstLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.GetAuthCodeUrl,
                correlationId
            );

            const secondLevelFirstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.HandleCodeResponseFromServer,
                correlationId
            );
            secondLevelFirstChildEvent.end({ success: true });

            const secondLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            secondLevelSecondChildEvent.end({ success: false }, error);
            firstLevelFirstChildEvent.end({ success: false }, error);

            const firstLevelSecondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            firstLevelSecondChildEvent.end({ success: true });
            rootEvent.end({ success: true });
        });
    });

    describe("discard", () => {
        it("discards cache data", () => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const dummyCorrelationId = "dummy-correlation-id";

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                correlationId
            );
            const firstEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            );
            mockPerfClient.setPreQueueTime(
                PerformanceEvents.AcquireTokenSilentAsync,
                correlationId
            );
            const secondEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            mockPerfClient.setPreQueueTime(
                PerformanceEvents.AcquireTokenFromCache,
                correlationId
            );
            secondEvent.end({ success: true });
            firstEvent.end({ success: true });
            rootEvent.discard();

            mockPerfClient.startMeasurement(
                PerformanceEvents.AcquireTokenSilent,
                dummyCorrelationId
            );
            mockPerfClient.setPreQueueTime(
                PerformanceEvents.AcquireTokenSilent,
                dummyCorrelationId
            );

            expect(
                // @ts-ignore
                mockPerfClient.eventsByCorrelationId.has(correlationId)
            ).toBeFalsy();
            expect(
                // @ts-ignore
                mockPerfClient.preQueueTimeByCorrelationId.has(correlationId)
            ).toBeFalsy();
            expect(
                // @ts-ignore
                mockPerfClient.queueMeasurements.has(correlationId)
            ).toBeFalsy();
            // @ts-ignore
            expect(mockPerfClient.eventStack.has(correlationId)).toBeFalsy();

            expect(
                // @ts-ignore
                mockPerfClient.eventsByCorrelationId.has(dummyCorrelationId)
            ).toBeTruthy();
            expect(
                // @ts-ignore
                mockPerfClient.preQueueTimeByCorrelationId.has(
                    dummyCorrelationId
                )
            ).toBeTruthy();
            expect(
                // @ts-ignore
                mockPerfClient.eventStack.has(dummyCorrelationId)
            ).toBeTruthy();
        });
    });
});
