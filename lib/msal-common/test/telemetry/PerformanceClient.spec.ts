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
    PerformanceEventStatus,
    ServerError,
} from "../../src/index.js";
import * as PerformanceEvents from "../../src/telemetry/performance/PerformanceEvents.js";
import crypto from "crypto";
import {
    compactStack,
    compactStackLine,
} from "../../src/telemetry/performance/PerformanceClient.js";
import * as PerformanceClient from "../../src/telemetry/performance/PerformanceClient.js";
import { AuthError } from "../../src/error/AuthError.js";
import { DataBoundary } from "../../src/account/AccountInfo.js";

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
            expect(
                events[0].ext?.[
                    "refreshTokenClientAcquireTokenWithCachedRefreshTokenDurationMs"
                ]
            ).toBe(Math.floor(samplePerfDuration));
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );

        // Start and end submeasurement
        const subMeasurement = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
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
            PerformanceEvents.RefreshTokenClientAcquireToken,
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

    it("addGlobalFields stamps fields onto subsequently started events", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const correlationId = "global-fields-correlation-id";

        mockPerfClient.addGlobalFields({ previousLibraryVersion: "3.0.0" });

        mockPerfClient.addPerformanceCallback((events) => {
            expect(events.length).toBe(1);
            expect(events[0].correlationId).toBe(correlationId);
            expect(events[0].previousLibraryVersion).toBe("3.0.0");
            done();
        });

        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );
        topLevelEvent.end({
            success: true,
        });
    });

    it("addGlobalFields merges across multiple calls and applies to every event", (done) => {
        const mockPerfClient = new MockPerformanceClient();
        const firstCorrelationId = "global-fields-first";
        const secondCorrelationId = "global-fields-second";

        mockPerfClient.addGlobalFields({ previousLibraryVersion: "2.5.0" });
        mockPerfClient.addGlobalFields({ previousLibraryVersion: "3.0.0" });

        const seen: Array<string | undefined> = [];
        mockPerfClient.addPerformanceCallback((events) => {
            seen.push(events[0].previousLibraryVersion);
            if (seen.length === 2) {
                expect(seen).toEqual(["3.0.0", "3.0.0"]);
                done();
            }
        });

        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                firstCorrelationId
            )
            .end({ success: true });
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                secondCorrelationId
            )
            .end({ success: true });
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
            PerformanceEvents.RefreshTokenClientAcquireToken,
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
            expect(
                event.ext?.[
                    "refreshTokenClientAcquireTokenWithCachedRefreshTokenDurationMs"
                ]
            ).toBe(Math.floor(samplePerfDuration));
            expect(
                event.ext?.[
                    "refreshTokenClientCreateTokenRequestBodyDurationMs"
                ]
            ).toBe(Math.floor(samplePerfDuration));
            expect(event.incompleteSubsCount).toEqual(0);
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientCreateTokenRequestBody,
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
            "",
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
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                correlationId
            )
            .end({ success: false }, publicError);
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientExecuteTokenRequest,
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
            "",
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
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );

        // Start and complete submeasurements
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                correlationId
            )
            .end({ success: false }, publicError);
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientCreateTokenRequestBody,
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
            expect(
                event.ext?.["refreshTokenClientAcquireTokenDurationMs"]
            ).toBeUndefined();
            expect(
                event.ext?.[
                    "refreshTokenClientExecutePostToTokenEndpointDurationMs"
                ]
            ).toBe(Math.floor(samplePerfDuration));
            expect(
                event.ext?.["silentCacheClientAcquireTokenDurationMs"]
            ).toBeUndefined();
            expect(event.incompleteSubsCount).toEqual(2);
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );

        // Start submeasurement but dont end it
        mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
            correlationId
        );
        mockPerfClient
            .startMeasurement(
                PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
                correlationId
            )
            .end({ status: PerformanceEventStatus.Completed });
        mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientCreateTokenRequestBody,
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
            expect(
                events[0].ext?.[
                    "refreshTokenClientExecutePostToTokenEndpointDurationMs"
                ]
            ).toBe(Math.floor(durationMs));
            expect(event.incompleteSubsCount).toEqual(0);
            expect(event.durationMs).toEqual(Math.floor(samplePerfDuration));
            done();
        });

        // Start and end top-level measurement
        const topLevelEvent = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );

        // Start and end submeasurements
        const subMeasure1 = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
            correlationId
        );
        subMeasure1.end({
            success: true,
        });

        const subMeasure2 = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
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
            expect(
                events[0].ext?.["refreshTokenClientAcquireTokenDurationMs"]
            ).toBe(Math.floor(samplePerfDuration));

            done();
        });

        // Start and end top-level measurement
        const topLevelEvent1 = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            correlationId
        );
        event1Id = topLevelEvent1.event.eventId;
        const topLevelEvent2 = mockPerfClient.startMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
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
            PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                "",
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
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                "",
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
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end(
                {
                    success: false,
                },
                error
            );
        });

        it("does not set serverErrorNo from ServerError when serverErrorNo is already present", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new ServerError(
                "test-error-code",
                "",
                undefined,
                undefined,
                "70011"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                // serverErrorNo was already set via addFields (clientdata),
                // so addError should NOT overwrite serverErrorNo
                expect(event.serverErrorNo).toEqual("basic-server-error-code");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );

            // Simulate instrumentClientData having set serverErrorNo via addFields
            mockPerfClient.addFields(
                { serverErrorNo: "basic-server-error-code" },
                correlationId
            );

            topLevelEvent.end(
                {
                    success: false,
                },
                error
            );
        });

        it("does not set serverErrorNo from InteractionRequiredAuthError when serverErrorNo is already present", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const error = new InteractionRequiredAuthError(
                "test-error-code",
                "",
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
                // serverErrorNo was already set via addFields (clientdata),
                // so addError should NOT overwrite serverErrorNo
                expect(event.serverErrorNo).toEqual("basic-server-error-code");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );

            // Simulate instrumentClientData having set serverErrorNo via addFields
            mockPerfClient.addFields(
                { serverErrorNo: "basic-server-error-code" },
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

    describe("context", () => {
        const perfDuration = Math.round(samplePerfDuration);
        const eventName = (name: string) => {
            return name;
        };
        const correlationId = "test-correlation-id";

        it("captures successful single event", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [eventName(
                            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint
                        )]: {
                            dur: perfDuration,
                        },
                        [`${eventName(
                            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint
                        )}_2`]: {
                            dur: perfDuration,
                        },
                        [`${eventName(
                            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint
                        )}_3`]: {
                            dur: perfDuration,
                            [eventName(thirdChildEventChild.event.name)]: {
                                dur: perfDuration,
                            },
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );

            const firstChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
                correlationId
            );
            firstChildEvent.end({ success: true });

            const secondChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
                correlationId
            );
            secondChildEvent.end({ success: true });

            const thirdChildEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
                correlationId
            );

            const thirdChildEventChild = mockPerfClient.startMeasurement(
                PerformanceEvents.GetAuthCodeUrl,
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
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [eventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            [eventName(secondLevelFirstChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                },
                            [eventName(secondLevelSecondChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                },
                        },
                        [eventName(firstLevelSecondChildEvent.event.name)]: {
                            dur: perfDuration,
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
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
                "",
                "test error message",
                "test sub error code"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [eventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            [eventName(secondLevelFirstChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                },
                            [eventName(secondLevelSecondChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                    err: error.errorCode,
                                    subErr: error.subError,
                                    fail: 1,
                                },
                        },
                        [eventName(firstLevelSecondChildEvent.event.name)]: {
                            dur: perfDuration,
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
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
                "",
                "test error message",
                "test sub error code"
            );
            const secondError = new AuthError(
                "test error code 2",
                "",
                "test error message 2",
                "test sub error code 2"
            );

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [eventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            err: secondError.errorCode,
                            subErr: secondError.subError,
                            [eventName(secondLevelFirstChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                },
                            [eventName(secondLevelSecondChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                    err: error.errorCode,
                                    subErr: error.subError,
                                    fail: 1,
                                },
                        },
                        [eventName(firstLevelSecondChildEvent.event.name)]: {
                            dur: perfDuration,
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
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
                "",
                "test error message",
                "test sub error code"
            );
            const secondError = new TypeError("test type error");

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(JSON.parse(event.context || "")).toEqual({
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [eventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            err: secondError.name,
                            [eventName(secondLevelFirstChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                },
                            [eventName(secondLevelSecondChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                    err: error.errorCode,
                                    subErr: error.subError,
                                    fail: 1,
                                },
                        },
                        [eventName(firstLevelSecondChildEvent.event.name)]: {
                            dur: perfDuration,
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
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
                    [eventName(rootEvent.event.name)]: {
                        dur: perfDuration,
                        [eventName(firstLevelFirstChildEvent.event.name)]: {
                            dur: perfDuration,
                            fail: 1,
                            [eventName(secondLevelFirstChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                },
                            [eventName(secondLevelSecondChildEvent.event.name)]:
                                {
                                    dur: perfDuration,
                                    err: error.name,
                                    fail: 1,
                                },
                        },
                        [eventName(firstLevelSecondChildEvent.event.name)]: {
                            dur: perfDuration,
                        },
                    },
                });
                done();
            });

            const rootEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
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
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
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
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            const firstEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
                correlationId
            );
            const secondEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                correlationId
            );
            secondEvent.end({ success: true });
            firstEvent.end({ success: true });
            rootEvent.discard();

            mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                dummyCorrelationId
            );

            expect(
                // @ts-ignore
                mockPerfClient.eventsByCorrelationId.has(correlationId)
            ).toBeFalsy();
            // @ts-ignore
            expect(mockPerfClient.eventStack.has(correlationId)).toBeFalsy();

            expect(
                // @ts-ignore
                mockPerfClient.eventsByCorrelationId.has(dummyCorrelationId)
            ).toBeTruthy();
            expect(
                // @ts-ignore
                mockPerfClient.eventStack.has(dummyCorrelationId)
            ).toBeTruthy();
        });
    });

    describe("account information handling", () => {
        it("sets accountType and dataBoundary when account is provided with dataBoundary", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const testAccount = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    tid: "test-tenant-id",
                },
                dataBoundary: "EU" as DataBoundary,
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBe("AAD");
                expect(event.dataBoundary).toBe("EU");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, testAccount);
        });

        it("sets accountType and defaults dataBoundary to undefined when account is provided without dataBoundary", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const testAccount = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    tid: "test-tenant-id",
                },
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBe("AAD");
                expect(event.dataBoundary).toBe(undefined);
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, testAccount);
        });

        it("does not set accountType or dataBoundary when account is not provided", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBeUndefined();
                expect(event.dataBoundary).toBeUndefined();
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true });
        });

        it("sets accountType to MSA for MSA accounts", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const msaAccount = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "9188040d-6c67-4c5b-b112-36a304b66dad",
                username: "test@outlook.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    tid: "9188040d-6c67-4c5b-b112-36a304b66dad",
                },
                dataBoundary: "None" as DataBoundary,
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBe("MSA");
                expect(event.dataBoundary).toBe("None");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, msaAccount);
        });

        it("sets accountType to B2C for B2C accounts with tfp claim", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const b2cAccount = {
                homeAccountId: "test-home-account-id",
                environment: "test.b2clogin.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    tfp: "B2C_1_SignUpSignIn",
                },
                dataBoundary: "None" as DataBoundary,
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBe("B2C");
                expect(event.dataBoundary).toBe("None");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, b2cAccount);
        });

        it("sets accountType to B2C for B2C accounts with acr claim", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const b2cAccount = {
                homeAccountId: "test-home-account-id",
                environment: "test.b2clogin.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    acr: "B2C_1_SignUpSignIn",
                },
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBe("B2C");
                expect(event.dataBoundary).toBe(undefined);
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, b2cAccount);
        });

        it("sets accountType to undefined when account has no tid, tfp, or acr claims", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const unknownAccount = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    sub: "test-subject",
                },
                dataBoundary: "None" as DataBoundary,
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBeUndefined();
                expect(event.dataBoundary).toBe("None");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, unknownAccount);
        });

        it("handles account with empty dataBoundary properly", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            const testAccount = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    tid: "test-tenant-id",
                },
                dataBoundary: "None" as DataBoundary,
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.accountType).toBe("AAD");
                expect(event.dataBoundary).toBe("None"); // Should be 'None' when dataBoundary is set to 'None'
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.end({ success: true }, undefined, testAccount);
        });

        it("endMeasurement overwrites accountType previously set via addFields when account is provided", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";
            // AAD account (tid is NOT the MSA tenant)
            const aadAccount = {
                homeAccountId: "test-home-account-id",
                environment: "login.microsoftonline.com",
                tenantId: "test-tenant-id",
                username: "test@example.com",
                localAccountId: "test-local-account-id",
                idTokenClaims: {
                    tid: "test-tenant-id",
                },
            };

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                // The account-derived type ("AAD") must overwrite the
                // addFields value ("MSA") — account info is authoritative.
                expect(event.accountType).toBe("AAD");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );

            // Simulate instrumentClientData setting accountType via addFields
            mockPerfClient.addFields({ accountType: "MSA" }, correlationId);

            // End with an AAD account — endMeasurement should overwrite accountType
            topLevelEvent.end({ success: true }, undefined, aadAccount);
        });

        it("addFields accountType is preserved when endMeasurement is called without account", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                // No account passed to end(), so the addFields value should remain
                expect(event.accountType).toBe("MSA");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );

            // Simulate instrumentClientData setting accountType via addFields
            mockPerfClient.addFields({ accountType: "MSA" }, correlationId);

            // End without account — addFields value should be preserved
            topLevelEvent.end({ success: true });
        });
    });

    describe("Dynamic fields", () => {
        it("routes dynamic-prefixed fields in incrementFields to event.ext", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.ext).toBeDefined();
                expect(event.ext?.["someApiCallCount"]).toBe(3);
                // Static fields should NOT be in dynamic
                expect(event.visibilityChangeCount).toBe(1);
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.increment({
                ["ext.someApiCallCount"]: 2,
            });
            topLevelEvent.increment({
                ["ext.someApiCallCount"]: 1,
            });
            topLevelEvent.increment({ visibilityChangeCount: 1 });
            topLevelEvent.end({ success: true });
        });

        it("routes dynamic-prefixed fields in addFields to event.ext", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.ext).toBeDefined();
                expect(event.ext?.["customLabel"]).toBe("myValue");
                // Static fields should be at the top level
                expect(event.extensionId).toBe("test-ext");
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.add({
                ["ext.customLabel"]: "myValue",
                extensionId: "test-ext",
            });
            topLevelEvent.end({ success: true });
        });

        it("stores sub-measurement durationMs in event.ext", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.ext).toBeDefined();
                expect(
                    event.ext?.[
                        "refreshTokenClientAcquireTokenWithCachedRefreshTokenDurationMs"
                    ]
                ).toBe(Math.floor(samplePerfDuration));
                // Top-level durationMs should still work
                expect(event.durationMs).toBeDefined();
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );

            const subMeasurement = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                correlationId
            );
            subMeasurement.end({ success: true });

            topLevelEvent.end({ success: true });
        });

        it("merges dynamic fields from multiple addFields calls", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.ext?.["fieldA"]).toBe("valueA");
                expect(event.ext?.["fieldB"]).toBe(42);
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.add({ ["ext.fieldA"]: "valueA" });
            topLevelEvent.add({ ["ext.fieldB"]: 42 });
            topLevelEvent.end({ success: true });
        });

        it("does not create ext object when no dynamic fields are set", (done) => {
            const mockPerfClient = new MockPerformanceClient();
            const correlationId = "test-correlation-id";

            mockPerfClient.addPerformanceCallback((events) => {
                expect(events.length).toBe(1);
                const event = events[0];
                expect(event.ext).toBeUndefined();
                done();
            });

            const topLevelEvent = mockPerfClient.startMeasurement(
                PerformanceEvents.RefreshTokenClientAcquireToken,
                correlationId
            );
            topLevelEvent.add({ extensionId: "test" });
            topLevelEvent.end({ success: true });
        });
    });
});
