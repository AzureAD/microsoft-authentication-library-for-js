import { buildConfiguration } from "../../src/config/Configuration";
import { OpenIdConfigProvider } from "../../src/config/OpenIdConfigProvider";
import { TEST_CONSTANTS } from "../utils/TestConstants";
import { Logger, NetworkResponse, ProtocolMode } from "@azure/msal-common";
import { OpenIdConfigResponse } from "../../src/response/OpenIdConfigResponse";
import { ValidationConfigurationError, ValidationConfigurationErrorMessage } from "../../src/error/ValidationConfigurationError";
import 'regenerator-runtime';
import { HttpClient } from "../../src/network/HttpClient";

describe("OpenIdConfigProvider", () => {
    let config = buildConfiguration({
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.DEFAULT_AUTHORITY
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("exports a class", () => {
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));
            expect(provider).toBeInstanceOf(OpenIdConfigProvider);
        });
    });

    describe("fetchJwksUriFromEndpoint", () => {

        it("returns jwks_uri", async () => {
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));

            const mockResponse: NetworkResponse<OpenIdConfigResponse> = {
                headers: { },
                body: {
                    jwks_uri: TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC
                },
                status: 200
            }

            const getEndpointSpy = jest.spyOn(provider, 'getOpenIdConfigurationEndpoint').mockReturnValue(Promise.resolve(TEST_CONSTANTS.WELL_KNOWN_ENDPOINT));

            const sendRequestSpy = jest.spyOn(HttpClient.prototype, 'sendGetRequestAsync').mockReturnValue(Promise.resolve(mockResponse));
    
            const response = await provider.fetchJwksUriFromEndpoint();
    
            expect(response).toEqual(TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC);

            expect(getEndpointSpy).toHaveBeenCalledTimes(1);
            expect(getEndpointSpy).toHaveBeenCalledWith(TEST_CONSTANTS.DEFAULT_AUTHORITY, ProtocolMode.OIDC);

            expect(sendRequestSpy).toHaveBeenCalledTimes(1);
            expect(sendRequestSpy).toHaveBeenCalledWith(TEST_CONSTANTS.WELL_KNOWN_ENDPOINT);
        });
    
        it("throws error if openIdResponse does not contain jwks_uri", async () => {
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));

            const mockResponse = {
                headers: { },
                body: {},
                status: 200
            };

            jest.spyOn(HttpClient.prototype, 'sendGetRequestAsync').mockReturnValue(Promise.resolve(mockResponse));
    
            await provider.fetchJwksUriFromEndpoint()
                .catch((e) => {
                    expect(e).toBeInstanceOf(ValidationConfigurationError);
                    expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.invalidMetadata.code);
                    expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.invalidMetadata.desc);
                });
        });

    });

    describe("getOpenIdConfigurationEndpoint", () => {
        it("returns a well-known endpoint", async () => {
            const config = buildConfiguration({
                auth: {
                    clientId: TEST_CONSTANTS.CLIENT_ID,
                    authority: TEST_CONSTANTS.DEFAULT_AUTHORITY
                }
            });
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));

            const result = await provider.getOpenIdConfigurationEndpoint(config.auth.authority, config.auth.protocolMode);

            expect(result).toEqual(TEST_CONSTANTS.WELL_KNOWN_ENDPOINT);
        });

        it("returns an AAD endpoint if ProtocolMode.AAD is configured", async () => {
            const config = buildConfiguration({
                auth: {
                    clientId: TEST_CONSTANTS.CLIENT_ID,
                    authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
                    protocolMode: ProtocolMode.AAD
                }
            });
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));

            const result = await provider.getOpenIdConfigurationEndpoint(config.auth.authority, config.auth.protocolMode);

            expect(result).toEqual(TEST_CONSTANTS.WELL_KNOWN_ENDPOINT_AAD);
        });

        it("returns valid endpoint even when authority does not end with /", async () => {
            const config = buildConfiguration({
                auth: {
                    clientId: TEST_CONSTANTS.CLIENT_ID,
                    authority: TEST_CONSTANTS.AUTHORITY
                }
            });
            const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));

            const result = await provider.getOpenIdConfigurationEndpoint(config.auth.authority, config.auth.protocolMode);

            const expectedEndpoint = "https://login.microsoftonline.com/TenantId/.well-known/openid-configuration";

            expect(result).toEqual(expectedEndpoint);
        });
    });

});
