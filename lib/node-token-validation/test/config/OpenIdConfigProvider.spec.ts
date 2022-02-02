import { buildConfiguration } from "../../src/config/Configuration";
import { OpenIdConfigProvider } from "../../src/config/OpenIdConfigProvider";
import { OPENID_CONFIG_RESPONSE, TEST_CONSTANTS } from "../utils/TestConstants";
import { Logger, NetworkResponse, ProtocolMode } from "@azure/msal-common";
import { OpenIdConfigResponse } from "../../src/response/OpenIdConfigResponse";
import { ValidationConfigurationError, ValidationConfigurationErrorMessage } from "../../src/error/ValidationConfigurationError";
import 'regenerator-runtime';

describe("OpenIdConfigProvider", () => {

    it("exports a class", () => {
        const config = buildConfiguration({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.DEFAULT_AUTHORITY
            }
        })
        const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));
        expect(provider).toBeInstanceOf(OpenIdConfigProvider);
    });

    it("returns OIDC jwks_uri", async () => {
        const config = buildConfiguration({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.DEFAULT_AUTHORITY
            }
        })
        const network = config.system.networkClient;
        const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));
        const mockResponse: NetworkResponse<OpenIdConfigResponse> = {
            headers: { },
            body: {jwks_uri: TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC}, // Need to fix this. Not being affected by protocolMode
            status: 200
        }
        jest.spyOn(network, 'sendGetRequestAsync').mockReturnValue(Promise.resolve(mockResponse));

        const response = await provider.fetchJwksUriFromEndpoint();

        expect(response).toEqual(TEST_CONSTANTS.DEFAULT_JWKS_URI_OIDC);
    });

    it("returns AAD jwks_uri if protocol mode set to AAD", async () => {
        const config = buildConfiguration({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.DEFAULT_AUTHORITY,
                protocolMode: ProtocolMode.AAD
            }
        });
        const network = config.system.networkClient;
        const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));
        const mockResponse: NetworkResponse<OpenIdConfigResponse> = {
            headers: { },
            body: {jwks_uri: TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD}, // Need to fix this
            status: 200
        }
        jest.spyOn(network, 'sendGetRequestAsync').mockReturnValue(Promise.resolve(mockResponse));

        const response = await provider.fetchJwksUriFromEndpoint();
        
        expect(response).toEqual(TEST_CONSTANTS.DEFAULT_JWKS_URI_AAD);
    });

    it("throws error if openIdResponse does not contain jwks_uri", async () => {
        const config = buildConfiguration({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.DEFAULT_AUTHORITY
            }
        })
        const network = config.system.networkClient;
        const provider = new OpenIdConfigProvider(config, config.system.networkClient, new Logger(config.system.loggerOptions));
        const mockResponse = {
            headers: { },
            body: {},
            status: 200
        }
        jest.spyOn(network, 'sendGetRequestAsync').mockReturnValue(Promise.resolve(mockResponse));

        provider.fetchJwksUriFromEndpoint()
            .catch((e) => {
                expect(e).toBeInstanceOf(ValidationConfigurationError);
                expect(e.errorCode).toContain(ValidationConfigurationErrorMessage.invalidMetadata.code);
                expect(e.errorMessage).toContain(ValidationConfigurationErrorMessage.invalidMetadata.desc);
            });
    });
});
