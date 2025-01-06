/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    buildAppConfiguration,
    Configuration,
} from "../../src/config/Configuration.js";
import { HttpClient } from "../../src/network/HttpClient.js";
import {
    TEST_CONSTANTS,
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
} from "../utils/TestConstants.js";
import {
    LogLevel,
    NetworkRequestOptions,
    AzureCloudInstance,
} from "@azure/msal-common";
import {
    ClientCredentialRequest,
    ConfidentialClientApplication,
} from "../../src/index.js";
import { OnBehalfOfRequest } from "../../src/request/OnBehalfOfRequest.js";
import { RANDOM_TEST_GUID } from "../test_kit/StringConstants.js";

describe("ClientConfiguration tests", () => {
    test("builds configuration and assigns default functions", () => {
        const config: Configuration = buildAppConfiguration({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
            },
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
            "error",
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Info,
            "info",
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Verbose,
            "verbose",
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Warning,
            "warning",
            false
        );
        config.system!.loggerOptions!.loggerCallback!(
            LogLevel.Warning,
            "warning",
            true
        );

        // expect(console.error).toHaveBeenLastCalledWith('error');
        // expect(console.info).toHaveBeenLastCalledWith('info');
        // expect(console.debug).toHaveBeenLastCalledWith('verbose');
        // expect(console.warn).toHaveBeenLastCalledWith('warning');
        // expect(console.warn).toHaveBeenCalledTimes(1);

        // auth options
        expect(config.auth!.authority).toEqual(
            TEST_CONSTANTS.DEFAULT_AUTHORITY
        );
        expect(config.auth!.azureCloudOptions?.azureCloudInstance).toEqual(
            AzureCloudInstance.None
        );
        expect(config.auth!.azureCloudOptions?.tenant).toEqual("");
        expect(config.auth!.clientId).toEqual(TEST_CONSTANTS.CLIENT_ID);

        // telemetry
        expect(config.telemetry!.application!.appName).toEqual("");
        expect(config.telemetry!.application!.appVersion).toEqual("");
    });

    test("builds configuration and assigns default functions", () => {
        const testNetworkResult = {
            testParam: "testValue",
        };

        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
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
            cache: {},
            telemetry: {
                application: {
                    appName: TEST_CONSTANTS.APP_NAME,
                    appVersion: TEST_CONSTANTS.APP_VERSION,
                },
            },
        };

        const testNetworkOptions: NetworkRequestOptions = {
            headers: {},
            body: "",
        };

        // network options
        expect(
            config.system!.networkClient!.sendGetRequestAsync(
                TEST_CONSTANTS.AUTH_CODE_URL,
                testNetworkOptions
            )
        ).resolves.toEqual(testNetworkResult);
        expect(
            config.system!.networkClient!.sendPostRequestAsync(
                TEST_CONSTANTS.AUTH_CODE_URL,
                testNetworkOptions
            )
        ).resolves.toEqual(testNetworkResult);

        // Logger options checks
        expect(config.system!.loggerOptions).toBeDefined();
        expect(config.system!.loggerOptions!.piiLoggingEnabled).toBe(true);

        // auth options
        expect(config.auth!.authority).toEqual(TEST_CONSTANTS.AUTHORITY);
        expect(config.auth!.clientId).toEqual(TEST_CONSTANTS.CLIENT_ID);

        // Application telemetry
        expect(config.telemetry!.application!.appName).toEqual(
            TEST_CONSTANTS.APP_NAME
        );
        expect(config.telemetry!.application!.appVersion).toEqual(
            TEST_CONSTANTS.APP_VERSION
        );
    });

    test("client capabilities are handled as expected", async () => {
        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
                clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
                clientCapabilities: ["TEST-CAPABILITY"],
            },
            system: {
                networkClient: {
                    sendGetRequestAsync: jest.fn(
                        async (): Promise<any> => AUTHENTICATION_RESULT
                    ),
                    sendPostRequestAsync: jest.fn(
                        async (): Promise<any> => AUTHENTICATION_RESULT
                    ),
                },
            },
        };

        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: true,
            correlationId: RANDOM_TEST_GUID,
        };

        await new ConfidentialClientApplication(
            appConfig
        ).acquireTokenByClientCredential(request);

        expect(
            appConfig.system?.networkClient?.sendPostRequestAsync
        ).toHaveBeenCalledWith(
            DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                "{tenant}",
                "tenantid"
            ) + `?client-request-id=${RANDOM_TEST_GUID}`,
            expect.objectContaining({
                body: expect.stringContaining("TEST-CAPABILITY"),
            })
        );
    });

    test("client capabilities are handled as expected for OBO flow", async () => {
        const oboRequest: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: "user_assertion_hash",
            skipCache: true,
            correlationId: RANDOM_TEST_GUID,
        };

        const appConfig: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
                clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
                clientCapabilities: ["TEST-CAPABILITY"],
            },
            system: {
                networkClient: {
                    sendGetRequestAsync: jest.fn(
                        async (): Promise<any> => AUTHENTICATION_RESULT
                    ),
                    sendPostRequestAsync: jest.fn(
                        async (): Promise<any> => AUTHENTICATION_RESULT
                    ),
                },
            },
        };

        await new ConfidentialClientApplication(
            appConfig
        ).acquireTokenOnBehalfOf(oboRequest);

        expect(
            appConfig.system?.networkClient?.sendPostRequestAsync
        ).toHaveBeenCalledWith(
            DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint.replace(
                "{tenant}",
                "tenantid"
            ) + `?client-request-id=${RANDOM_TEST_GUID}`,
            expect.objectContaining({
                body: expect.stringContaining("TEST-CAPABILITY"),
            })
        );
    });
});
