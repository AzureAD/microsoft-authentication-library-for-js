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
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toEqual(InteractionType.Popup);
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
    });

    it("can remove an event callback", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toEqual(InteractionType.Popup);
        };

        const callbackSpy = jest.fn(subscriber);

        const eventHandler = new EventHandler(logger);

        const callbackId = eventHandler.addEventCallback(callbackSpy);
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
        eventHandler.removeEventCallback(callbackId || "");
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
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
            InteractionType.Redirect
        );
    });

    it("sets interactionType, payload, and error to null by default", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toBeNull();
            expect(message.payload).toBeNull();
            expect(message.error).toBeNull();
            expect(message.timestamp).not.toBeNull();
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(EventType.LOGIN_START);
    });

    it("sets all expected fields on event", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toEqual(InteractionType.Silent);
            expect(message.payload).toEqual({ scopes: ["user.read"] });
            expect(message.error).toBeNull();
            expect(message.timestamp).not.toBeNull();
            done();
        };

        const eventHandler = new EventHandler(logger);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(
            EventType.LOGIN_START,
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
            InteractionType.Redirect
        );
        expect(callback1Events.length).toBe(1);
        expect(callback2Events.length).toBe(0);
        expect(callback1Events[0]).toBe(EventType.ACQUIRE_TOKEN_START);

        eventHandler.emitEvent(
            EventType.ACQUIRE_TOKEN_SUCCESS,
            InteractionType.Redirect
        );
        expect(callback1Events.length).toBe(1);
        expect(callback2Events.length).toBe(1);
        expect(callback1Events[0]).toBe(EventType.ACQUIRE_TOKEN_START);
        expect(callback2Events[0]).toBe(EventType.ACQUIRE_TOKEN_SUCCESS);
    });
});
