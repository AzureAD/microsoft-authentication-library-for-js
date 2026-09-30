import { EventMessage } from "../../src/event/EventMessage.js";
import { EventType } from "../../src/event/EventType.js";
import { InteractionType } from "../../src/utils/BrowserConstants.js";
import { EventHandler } from "../../src/event/EventHandler.js";
import { Logger, LogLevel } from "../../src/index.js";

describe("Event API tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const loggerOptions = {
        loggerCallback: (
            level: LogLevel,
            message: string,
            containsPii: boolean
        ): void => {
            if (containsPii) {
                console.log(`Log level: ${level} Message: ${message}`);
            }
        },
        piiLoggingEnabled: true,
    };
    const logger = new Logger(loggerOptions);

    it("can add an event callback and broadcast to it", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_SUCCESS);
            expect(message.interactionType).toEqual(InteractionType.Popup);
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            "test-correlation-id",
            InteractionType.Popup
        );
    });

    it("can remove an event callback", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_SUCCESS);
            expect(message.interactionType).toEqual(InteractionType.Popup);
        };

        const callbackSpy = jest.fn(subscriber);

        const eventHandler = new EventHandler(logger);

        const callbackId = eventHandler.addEventCallback(callbackSpy);
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            "test-correlation-id",
            InteractionType.Popup
        );
        eventHandler.removeEventCallback(callbackId || "");
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            "test-correlation-id",
            InteractionType.Popup
        );
        expect(callbackSpy).toHaveBeenCalledTimes(1);
        done();
    });

    it("can add multiple callbacks and broadcast to all", (done) => {
        const subscriber1 = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_START);
            expect(message.interactionType).toEqual(InteractionType.Redirect);
        };

        const subscriber2 = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_START);
            expect(message.interactionType).toEqual(InteractionType.Redirect);
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber1);
        eventHandler.addEventCallback(subscriber2);
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            "test-correlation-id",
            InteractionType.Redirect
        );
    });

    it("sets interactionType, payload, and error to null by default", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_SUCCESS);
            expect(message.interactionType).toBeNull();
            expect(message.payload).toBeNull();
            expect(message.error).toBeNull();
            expect(message.timestamp).not.toBeNull();
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            "test-correlation-id"
        );
    });

    it("sets all expected fields on event", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.ACQUIRE_TOKEN_SUCCESS);
            expect(message.interactionType).toEqual(InteractionType.Silent);
            expect(message.payload).toEqual({ scopes: ["user.read"] });
            expect(message.error).toBeNull();
            expect(message.timestamp).not.toBeNull();
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            "test-correlation-id",
            InteractionType.Silent,
            { scopes: ["user.read"] },
            null
        );
    });

    it("passing in eventTypes limits which events invoke callback", () => {
        const callback1Events: EventType[] = [];
        const subscriber1 = (message: EventMessage) => {
            callback1Events.push(message.eventType);
        };

        const callback2Events: EventType[] = [];
        const subscriber2 = (message: EventMessage) => {
            callback2Events.push(message.eventType);
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber1, [
            EventType.ACQUIRE_TOKEN_START,
        ]);
        eventHandler.addEventCallback(subscriber2, [
            EventType.ACQUIRE_TOKEN_SUCCESS,
        ]);
        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_START,
            "test-correlation-id",
            InteractionType.Redirect
        );
        expect(callback1Events.length).toBe(1);
        expect(callback2Events.length).toBe(0);
        expect(callback1Events[0]).toBe(EventType.ACQUIRE_TOKEN_START);

        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            "test-correlation-id",
            InteractionType.Redirect
        );
        expect(callback1Events.length).toBe(1);
        expect(callback2Events.length).toBe(1);
        expect(callback1Events[0]).toBe(EventType.ACQUIRE_TOKEN_START);
        expect(callback2Events[0]).toBe(EventType.ACQUIRE_TOKEN_SUCCESS);
    });

    describe("cross-tab events", () => {
        it("opens a BroadcastChannel only while subscribed", () => {
            const eventHandler = new EventHandler(logger);
            // @ts-ignore
            expect(eventHandler.broadcastChannel).toBeUndefined();

            eventHandler.subscribeCrossTab();
            // @ts-ignore
            expect(eventHandler.broadcastChannel).toBeInstanceOf(
                BroadcastChannel
            );

            eventHandler.unsubscribeCrossTab();
            // @ts-ignore
            expect(eventHandler.broadcastChannel).toBeUndefined();
        });

        it("sends LOGIN_SUCCESS to a subscribed instance without keeping a channel open", (done) => {
            const receiver = new EventHandler(logger);
            const sender = new EventHandler(logger);
            receiver.subscribeCrossTab();
            receiver.addEventCallback((message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.LOGIN_SUCCESS);
                expect(message.correlationId).toEqual("test-correlation-id");
                // @ts-ignore
                expect(sender.broadcastChannel).toBeUndefined();
                receiver.unsubscribeCrossTab();
                done();
            });

            sender.emitEvent(
                EventType.LOGIN_SUCCESS,
                "test-correlation-id",
                InteractionType.Popup
            );
        });
    });
});
