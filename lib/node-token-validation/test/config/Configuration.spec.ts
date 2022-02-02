import { Configuration, buildConfiguration } from "../../src/config/Configuration";
import { HttpClient } from "../../src/network/HttpClient";
import { TEST_CONSTANTS } from "../utils/TestConstants";
import { LogLevel, NetworkRequestOptions } from "@azure/msal-common";
import 'regenerator-runtime';

describe("Configuration", () => {
    it("builds configuration and assigns default functions", () => {
        const config: Configuration = buildConfiguration({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID
            }
        });

        // network options
        expect(config.system!.networkClient).toBeDefined();
        expect(config.system!.networkClient).toBeInstanceOf(HttpClient);
        expect(config.system!.networkClient!.sendGetRequestAsync).toBeDefined();
        expect(
            config.system!.networkClient!.sendPostRequestAsync
        ).toBeDefined();

        // logger options checks
        console.error = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();
        console.warn = jest.fn();

        expect(config.system!.loggerOptions).toBeDefined();
        expect(config.system!.loggerOptions!.piiLoggingEnabled).toBe(false);

        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Error,
            'error',
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Info,
            'info',
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Verbose,
            'verbose',
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Warning,
            'warning',
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Warning,
            'warning',
            true
        );

        // auth options
        expect(config.auth.authority).toEqual(TEST_CONSTANTS.DEFAULT_AUTHORITY);
        expect(config.auth.clientId).toEqual(TEST_CONSTANTS.CLIENT_ID);
        expect(config.auth.clockSkew).toEqual(TEST_CONSTANTS.DEFAULT_CLOCK_SKEW);

    });

    it('builds configuration and assigns default functions', () => {
        const testNetworkResult = {
            testParam: 'testValue',
        };

        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY
            },
            system: {
                networkClient: {
                    sendGetRequestAsync: async (
                        url: string,
                        options?: NetworkRequestOptions
                    ): Promise<any> => {
                        if (url && options) {
                            return testNetworkResult;
                        }
                    },
                    sendPostRequestAsync: async (
                        url: string,
                        options?: NetworkRequestOptions
                    ): Promise<any> => {
                        if (url && options) {
                            return testNetworkResult;
                        }
                    },
                },
                loggerOptions: {
                    loggerCallback: (
                        level: LogLevel,
                        message: string,
                        containsPii: boolean
                    ): void => {
                        if (containsPii) {
                            console.log(
                                `Log level: ${level} Message: ${message}`
                            );
                        }
                    },
                    piiLoggingEnabled: true,
                },
            },
        };

        const testNetworkOptions: NetworkRequestOptions = {
            headers: {},
            body: '',
        };

        // network options
        expect(
            config.system!.networkClient!.sendGetRequestAsync(
                TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC,
                testNetworkOptions
            )
        ).resolves.toEqual(testNetworkResult);
        expect(
            config.system!.networkClient!.sendPostRequestAsync(
                TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC,
                testNetworkOptions
            )
        ).resolves.toEqual(testNetworkResult);

        // Logger options checks
        expect(config.system!.loggerOptions).toBeDefined();
        expect(config.system!.loggerOptions!.piiLoggingEnabled).toBe(true);

        // auth options
        expect(config.auth!.authority).toEqual(TEST_CONSTANTS.AUTHORITY);
        expect(config.auth!.clientId).toEqual(TEST_CONSTANTS.CLIENT_ID);
    });
});
