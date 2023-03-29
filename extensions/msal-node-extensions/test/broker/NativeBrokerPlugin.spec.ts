import { NativeBrokerPlugin } from "../../src/broker/NativeBrokerPlugin";

jest.mock("@azure/msal-node-runtime");

describe("NativeBrokerPlugin", () => {
    describe("constructor", () => {
        it("Sets isBrokerAvailable to true if the broker is available", () => {
            const nativeBrokerPlugin = new NativeBrokerPlugin();
            expect(nativeBrokerPlugin.isBrokerAvailable).toBe(true);
        });

        it("Sets isBrokerAvailable to false if the broker is not available", () => {
            const nativeBrokerPlugin = new NativeBrokerPlugin();
            expect(nativeBrokerPlugin.isBrokerAvailable).toBe(false);
        });
    });
});