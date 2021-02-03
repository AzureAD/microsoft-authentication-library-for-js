/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import { InteractionStatus, InteractionType } from "../../src";
import { EventMessage, EventMessageUtils } from "../../src/event/EventMessage";
import { EventType } from "../../src/event/EventType";

describe("EventMessage.ts Unit Tests", () => {

    describe("getInteractionStatusFromEvent()", () => {
        let TEST_EVENT_MESSAGE: EventMessage = {
            eventType: EventType.LOGIN_START,
            interactionType: InteractionType.Popup,
            payload: null,
            error: null,
            timestamp: 0
        }

        it("returns status Login with event type LOGIN_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.LOGIN_START;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.Login);
        });

        it("returns status SsoSilent with event type SSO_SILENT_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.SSO_SILENT_START;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.SsoSilent);
        });

        it("returns status AcquireToken with event type ACQUIRE_TOKEN_START and interaction type Popup", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_START;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Popup;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.AcquireToken);
        });

        it("returns null with event type ACQUIRE_TOKEN_START and an interaction type that is not Popup or Redirect", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_START;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Silent;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(null);
        });

        it("returns status HandleRedirect with event type HANDLE_REDIRECT_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.HANDLE_REDIRECT_START;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.HandleRedirect);
        });

        it("returns status Logout with event type LOGOUT_START", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.LOGOUT_START;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.Logout);
        });

        it("returns status None with event type LOGIN_SUCCESS", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.LOGIN_SUCCESS;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.None);
        });

        it("returns status None with event type ACQUIRE_TOKEN_SUCCESS and interaction type redirect", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_SUCCESS;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Redirect;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(InteractionStatus.None);
        });

        it("returns null with event type ACQUIRE_TOKEN_FAILURE and an interaction type that is not popup or redirect", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_FAILURE;
            TEST_EVENT_MESSAGE.interactionType = InteractionType.Silent;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(null);
        });

        it("returns null with event type not in switch statement", () => {
            TEST_EVENT_MESSAGE.eventType = EventType.ACQUIRE_TOKEN_NETWORK_START;

            const result = EventMessageUtils.getInteractionStatusFromEvent(TEST_EVENT_MESSAGE);
            expect(result).to.equal(null);
        });
    });
});
