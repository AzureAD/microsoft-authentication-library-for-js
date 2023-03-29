import { NativeBrokerPlugin } from "../../src/broker/NativeBrokerPlugin";
import { ErrorStatus, msalNodeRuntime } from "@azure/msal-node-runtime";

describe("NativeBrokerPlugin", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    })
    describe("constructor", () => {
        it("Sets isBrokerAvailable to true if the broker is available", () => {
            jest.replaceProperty(msalNodeRuntime, 'StartupError', undefined);
            const nativeBrokerPlugin = new NativeBrokerPlugin();
            expect(nativeBrokerPlugin.isBrokerAvailable).toBe(true);
        });

        it("Sets isBrokerAvailable to false if the broker is not available", () => {
            jest.replaceProperty(msalNodeRuntime, 'StartupError', {
                errorCode: 0,
                errorStatus: ErrorStatus.Unexpected,
                errorContext: "Test Startup Error",
                errorTag: 0
            });
            const nativeBrokerPlugin = new NativeBrokerPlugin();
            expect(nativeBrokerPlugin.isBrokerAvailable).toBe(false);
        });
    });
});