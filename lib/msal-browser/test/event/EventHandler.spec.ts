import { EventMessage } from "../../src/event/EventMessage";
import { EventType } from "../../src/event/EventType";
import { InteractionType } from "../../src/utils/BrowserConstants";
import sinon from "sinon";
import { EventHandler } from "../../src/event/EventHandler";
import { Logger, LogLevel, AccountInfo, AccountEntity } from "../../src";
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
    const browserCrypto = new CryptoOps(logger);

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

    describe("handleAccountCacheChange", () => {
        it("ACCOUNT_ADDED event raised when an account logs in in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.ACCOUNT_ADDED);
                expect(message.interactionType).toBeNull();
                expect(message.payload).toEqual(account);
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            const eventHandler = new EventHandler(logger, browserCrypto);
            eventHandler.addEventCallback(subscriber);

            const accountEntity = {
                homeAccountId: "test-home-accountId-1",
                localAccountId: "test-local-accountId-1",
                username: "user-1@example.com",
                environment: "test-environment-1",
                realm: "test-tenantId-1",
                name: "name-1",
                idTokenClaims: {},
                authorityType: "AAD"
            }

            const account: AccountInfo = {
                homeAccountId: accountEntity.homeAccountId,
                localAccountId: accountEntity.localAccountId,
                username: accountEntity.username,
                environment: accountEntity.environment,
                tenantId: accountEntity.realm,
                name: accountEntity.name,
                idTokenClaims: accountEntity.idTokenClaims
            };

            const cacheKey1 = AccountEntity.generateAccountCacheKey(account);
    
            // @ts-ignore
            eventHandler.handleAccountCacheChange({
                key: cacheKey1,
                oldValue: null,
                newValue: JSON.stringify(accountEntity)
            });
        });

        it("ACCOUNT_REMOVED event raised when an account logs out in another tab", (done) => {
            const subscriber = (message: EventMessage) => {
                expect(message.eventType).toEqual(EventType.ACCOUNT_REMOVED);
                expect(message.interactionType).toBeNull();
                expect(message.payload).toEqual(account);
                expect(message.error).toBeNull();
                expect(message.timestamp).not.toBeNull();
                done();
            };

            const eventHandler = new EventHandler(logger, browserCrypto);
            eventHandler.addEventCallback(subscriber);

            const accountEntity = {
                homeAccountId: "test-home-accountId-1",
                localAccountId: "test-local-accountId-1",
                username: "user-1@example.com",
                environment: "test-environment-1",
                realm: "test-tenantId-1",
                name: "name-1",
                idTokenClaims: {},
                authorityType: "AAD"
            }

            const account: AccountInfo = {
                homeAccountId: accountEntity.homeAccountId,
                localAccountId: accountEntity.localAccountId,
                username: accountEntity.username,
                environment: accountEntity.environment,
                tenantId: accountEntity.realm,
                name: accountEntity.name,
                idTokenClaims: accountEntity.idTokenClaims
            };

            const cacheKey1 = AccountEntity.generateAccountCacheKey(account);
    
            // @ts-ignore
            eventHandler.handleAccountCacheChange({
                key: cacheKey1,
                oldValue: JSON.stringify(accountEntity),
                newValue: null
            });
        });

        it("No event raised if cache value is not JSON", () => {
            const subscriber = (message: EventMessage) => {};
            const eventHandler = new EventHandler(logger, browserCrypto);
            eventHandler.addEventCallback(subscriber);

            const emitEventSpy = sinon.spy(eventHandler, "emitEvent");
            // @ts-ignore
            eventHandler.handleAccountCacheChange({
                key: "testCacheKey",
                oldValue: "not JSON",
                newValue: null
            });

            expect(emitEventSpy.getCalls().length).toBe(0);
        });

        it("No event raised if cache value is not an account", () => {
            const subscriber = (message: EventMessage) => {};
            const eventHandler = new EventHandler(logger, browserCrypto);
            eventHandler.addEventCallback(subscriber);

            const emitEventSpy = sinon.spy(eventHandler, "emitEvent");
            // @ts-ignore
            eventHandler.handleAccountCacheChange({
                key: "testCacheKey",
                oldValue: JSON.stringify({testKey: "this is not an account object"}),
                newValue: null
            });

            expect(emitEventSpy.getCalls().length).toBe(0);
        });

        it("No event raised if both oldValue and newValue are falsey", () => {
            const subscriber = (message: EventMessage) => {};
            const eventHandler = new EventHandler(logger, browserCrypto);
            eventHandler.addEventCallback(subscriber);

            const emitEventSpy = sinon.spy(eventHandler, "emitEvent");
            // @ts-ignore
            eventHandler.handleAccountCacheChange({
                key: "testCacheKey",
                oldValue: null,
                newValue: null
            });

            expect(emitEventSpy.getCalls().length).toBe(0);
        });
    });
});
