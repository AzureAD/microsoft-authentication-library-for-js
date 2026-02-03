/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InteractionStatus, InteractionType } from "../../src/utils/BrowserConstants.js";
import { EventMessage, EventMessageUtils } from "../../src/event/EventMessage.js";
import { EventType } from "../../src/event/EventType.js";

describe("EventMessage.ts Unit Tests", () => {
    describe("getInteractionStatusFromEvent()", () => {
        let TEST_EVENT_MESSAGE: EventMessage = {
            eventType: EventType.ACQUIRE_TOKEN_SUCCESS,
            interactionType: InteractionType.Popup,
            payload: null,
            error: null,
            timestamp: 0,
            correlationId: "test-correlation-id",
        };

        it("returns status AcquireToken with event type ACQUIRE_TOKEN_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_START;

            const result =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(result).toBe(InteractionStatus.AcquireToken);
        });

        it("returns status AcquireToken with event type ACQUIRE_TOKEN_START and interaction type Popup", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_START;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Popup;

            const result =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(result).toBe(InteractionStatus.AcquireToken);
        });

        it("returns null with event type ACQUIRE_TOKEN_START and a null interaction type", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_START;
            TEST_EVENT_MESSAGE.interactionType = null;

            const result =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(result).toBe(null);
        });

        it("returns status HandleRedirect with event type HANDLE_REDIRECT_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.HANDLE_REDIRECT_START;

            const result =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(result).toBe(InteractionStatus.HandleRedirect);
        });

        it("returns status Logout with event type LOGOUT_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.LOGOUT_START;

            const result =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(result).toBe(InteractionStatus.Logout);
        });

        it("returns status None with event type HANDLE_REDIRECT_END", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.HANDLE_REDIRECT_END;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.HandleRedirect
            );
            expect(test1).toBe(InteractionStatus.None);

            const test2 =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(test2).toBe(InteractionStatus.None);
        });

        it("returns null with event type HANDLE_REDIRECT_END if current interaction is not handleRedirect", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.HANDLE_REDIRECT_END;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.AcquireToken
            );
            expect(test1).toBe(null);
        });

        it("returns null with event type LOGIN_SUCCESS if current interaction is not login or acquireToken", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.LOGIN_SUCCESS;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Redirect;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.HandleRedirect
            );
            expect(test1).toBe(null);
        });

        it("returns status None with event type ACQUIRE_TOKEN_SUCCESS and interaction type redirect", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_SUCCESS;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Redirect;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.AcquireToken
            );
            expect(test1).toBe(InteractionStatus.None);

            const test2 =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(test2).toBe(InteractionStatus.None);
        });

        it("returns status None with event type RESTORE_FROM_BFCACHE", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.RESTORE_FROM_BFCACHE;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Redirect;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.AcquireToken
            );
            expect(test1).toBe(InteractionStatus.None);

            const test2 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.AcquireToken
            );
            expect(test2).toBe(InteractionStatus.None);
        });

        it("returns null with event type ACQUIRE_TOKEN_SUCCESS if current interaction is not login or acquireToken", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_SUCCESS;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Redirect;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.HandleRedirect
            );
            expect(test1).toBe(null);
        });

        it("returns null with event type ACQUIRE_TOKEN_FAILURE and a none interaction type", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_FAILURE;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.None;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.AcquireToken
            );
            expect(test1).toBe(null);

            const test2 =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(test1).toBe(null);
        });

        it("returns null with event type ACQUIRE_TOKEN_FAILURE if current interaction is not login or acquireToken", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_FAILURE;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Redirect;

            const test1 = EventMessageUtils.getInteractionStatusFromEvent(
                TEST_EVENT_MESSAGE,
                InteractionStatus.HandleRedirect
            );
            expect(test1).toBe(null);
        });

        it("returns null with event type not in switch statement", () => {
            TEST_EVENT_MESSAGE.eventType =
                EventType.ACQUIRE_TOKEN_NETWORK_START;

            const result =
                EventMessageUtils.getInteractionStatusFromEvent(
                    TEST_EVENT_MESSAGE
                );
            expect(result).toBe(null);
        });
    });
});
