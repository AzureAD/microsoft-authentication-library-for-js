import { EventMessage } from "../../src/event/EventMessage";
import { EventType } from "../../src/event/EventType";
import { InteractionType } from "../../src/utils/BrowserConstants";
import sinon from "sinon";
import { EventHandler } from "../../src/event/EventHandler";
import { Logger, LogLevel } from "../../src";
import { CryptoOps } from "../../src/crypto/CryptoOps";

describe("Event API tests", () => {
    const loggerOptions = {
        loggerCallback: (level: LogLevel, message: string, containsPii: boolean): void => {
            if (containsPii) {
                console.log(`Log level: ${level} Message: ${message}`);
            }
        },
        piiLoggingEnabled: true
    };
    const logger = new Logger(loggerOptions);
    const browserCrypto = new CryptoOps();

    it("can add an event callback and broadcast to it", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toEqual(InteractionType.Popup);
            done();
        };

        const eventHandler = new EventHandler(logger, browserCrypto);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
    });

    it("can remove an event callback", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toEqual(InteractionType.Popup);
        };

        const callbackSpy = sinon.spy(subscriber);

        const eventHandler = new EventHandler(logger, browserCrypto);
        
        const callbackId = eventHandler.addEventCallback(callbackSpy);
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
        eventHandler.removeEventCallback(callbackId || "");
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Popup);
        expect(callbackSpy.calledOnce).toBeTruthy();
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

        const eventHandler = new EventHandler(logger, browserCrypto);

        eventHandler.addEventCallback(subscriber1);
        eventHandler.addEventCallback(subscriber2);
        eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Redirect);
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

        const eventHandler = new EventHandler(logger, browserCrypto);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(EventType.LOGIN_START);
    });

    it("sets all expected fields on event", (done) => {
        const subscriber = (message: EventMessage) => {
            expect(message.eventType).toEqual(EventType.LOGIN_START);
            expect(message.interactionType).toEqual(InteractionType.Silent);
            expect(message.payload).toEqual({scopes: ["user.read"]});
            expect(message.error).toBeNull();
            expect(message.timestamp).not.toBeNull();
            done();
        };

        const eventHandler = new EventHandler(logger, browserCrypto);

        eventHandler.addEventCallback(subscriber);
        eventHandler.emitEvent(EventType.LOGIN_START, InteractionType.Silent, {scopes: ["user.read"]}, null);
    });
});