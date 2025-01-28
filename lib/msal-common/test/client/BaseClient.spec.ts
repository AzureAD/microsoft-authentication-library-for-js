import { BaseClient } from "../../src/client/BaseClient.js";
import { HeaderNames, Constants } from "../../src/utils/Constants.js";
import { ClientTestUtils } from "./ClientTestUtils.js";
import { ClientConfiguration } from "../../src/config/ClientConfiguration.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    AUTHENTICATION_RESULT,
    NETWORK_REQUEST_OPTIONS,
    THUMBPRINT,
    THROTTLING_ENTITY,
    RANDOM_TEST_GUID,
} from "../test_kit/StringConstants.js";
import { Authority } from "../../src/authority/Authority.js";

import { ThrottlingUtils } from "../../src/network/ThrottlingUtils.js";
import { RequestThumbprint } from "../../src/network/RequestThumbprint.js";
import { NetworkResponse } from "../../src/network/NetworkResponse.js";
import { ServerAuthorizationTokenResponse } from "../../src/response/ServerAuthorizationTokenResponse.js";
import { NetworkRequestOptions } from "../../src/network/INetworkModule.js";
import { ServerError } from "../../src/error/ServerError.js";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError.js";

class TestClient extends BaseClient {
    constructor(config: ClientConfiguration) {
        super(config);
    }

    getLogger() {
        return this.logger;
    }

    getConfig() {
        return this.config;
    }

    getCryptoUtils() {
        return this.cryptoUtils;
    }

    getNetworkClient() {
        return this.networkClient;
    }

    getDefaultAuthorityInstance() {
        return this.authority;
    }

    createTokenRequestHeaders(): Record<string, string> {
        return super.createTokenRequestHeaders();
    }
}

describe("BaseClient.ts Class Unit Tests", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        it("Creates a valid BaseClient object", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof BaseClient).toBe(true);
        });

        it("Sets fields on BaseClient object", async () => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            expect(client.getConfig()).not.toBeNull();
            expect(client.getCryptoUtils()).not.toBeNull();
            expect(client.getDefaultAuthorityInstance()).not.toBeNull();
            expect(client.getNetworkClient()).not.toBeNull();
        });
    });

    describe("Header utils", () => {
        beforeEach(() => {
            jest.spyOn(
                Authority.prototype,
                <any>"getEndpointMetadataFromNetwork"
            ).mockResolvedValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        });

        it("Creates default token request headers", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createTokenRequestHeaders();

            expect(headers[HeaderNames.CONTENT_TYPE]).toBe(
                Constants.URL_FORM_CONTENT_TYPE
            );
        });
    });

    describe("sendPostRequest tests", () => {
        it("returns a response", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const networkStub = jest
                .spyOn(
                    // @ts-ignore
                    client.networkClient,
                    "sendPostRequestAsync"
                )
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "getThrottlingCache"
                )
                .mockImplementation();
            const setThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "setThrottlingCache"
                )
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "removeItem"
                )
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            const res =
                await client.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(res).toEqual(mockRes);
        });

        it("blocks the request if item is found in the cache", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockThrottlingEntity = THROTTLING_ENTITY;
            const networkStub = jest
                .spyOn(
                    // @ts-ignore
                    client.networkClient,
                    "sendPostRequestAsync"
                )
                .mockImplementation();
            const getThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "getThrottlingCache"
                )
                .mockReturnValue(mockThrottlingEntity);
            const setThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "setThrottlingCache"
                )
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "removeItem"
                )
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            try {
                await client.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID
                );
            } catch {}

            expect(networkStub).toHaveBeenCalledTimes(0);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(() =>
                ThrottlingUtils.preProcess(
                    // @ts-ignore
                    client.cacheManager,
                    thumbprint
                )
            ).toThrowError(ServerError);
        });

        it("passes request through if expired item in cache", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 200,
            };
            const mockThrottlingEntity = THROTTLING_ENTITY;
            const networkStub = jest
                .spyOn(
                    // @ts-ignore
                    client.networkClient,
                    "sendPostRequestAsync"
                )
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "getThrottlingCache"
                )
                .mockReturnValue(mockThrottlingEntity);
            const setThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "setThrottlingCache"
                )
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "removeItem"
                )
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(10);

            const res =
                await client.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(0);
            expect(removeItemStub).toHaveBeenCalledTimes(1);
            expect(res).toEqual(mockRes);
        });

        it("creates cache entry on error", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;
            const mockRes: NetworkResponse<ServerAuthorizationTokenResponse> = {
                headers: {},
                body: AUTHENTICATION_RESULT.body,
                status: 500,
            };
            const networkStub = jest
                .spyOn(
                    // @ts-ignore
                    client.networkClient,
                    "sendPostRequestAsync"
                )
                .mockResolvedValue(mockRes);
            const getThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "getThrottlingCache"
                )
                .mockImplementation();
            const setThrottlingStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "setThrottlingCache"
                )
                .mockImplementation();
            const removeItemStub = jest
                .spyOn(
                    // @ts-ignore
                    client.cacheManager,
                    "removeItem"
                )
                .mockImplementation();
            jest.spyOn(Date, "now").mockReturnValue(1);

            const res =
                await client.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID
                );

            expect(networkStub).toHaveBeenCalledTimes(1);
            expect(getThrottlingStub).toHaveBeenCalledTimes(1);
            expect(setThrottlingStub).toHaveBeenCalledTimes(1);
            expect(removeItemStub).toHaveBeenCalledTimes(0);
            expect(res).toEqual(mockRes);
        });

        it("throws network error if fetch client fails", async () => {
            const thumbprint: RequestThumbprint = THUMBPRINT;
            const options: NetworkRequestOptions = NETWORK_REQUEST_OPTIONS;

            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            jest.spyOn(
                // @ts-ignore
                client.networkClient,
                "sendPostRequestAsync"
            ).mockRejectedValue(new Error("Fetch failed"));

            try {
                await client.sendPostRequest<ServerAuthorizationTokenResponse>(
                    thumbprint,
                    "tokenEndpoint",
                    options,
                    RANDOM_TEST_GUID
                );
                throw new Error("Function did not throw");
            } catch (e) {
                expect(e).toBeInstanceOf(ClientAuthError);
                expect((e as ClientAuthError).errorCode).toBe(
                    ClientAuthErrorCodes.networkError
                );
            }
        });
    });
});
