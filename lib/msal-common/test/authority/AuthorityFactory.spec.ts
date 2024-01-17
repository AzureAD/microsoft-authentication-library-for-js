import * as AuthorityFactory from "../../src/authority/AuthorityFactory";
import {
    INetworkModule,
    NetworkRequestOptions,
} from "../../src/network/INetworkModule";
import { TEST_CONFIG } from "../test_kit/StringConstants";
import { Constants } from "../../src/utils/Constants";
import { Authority } from "../../src/authority/Authority";
import { AuthorityType } from "../../src/authority/AuthorityType";
import { MockCache } from "../cache/MockCache";
import { mockCrypto } from "../client/ClientTestUtils";
import { AuthorityOptions } from "../../src/authority/AuthorityOptions";
import { ProtocolMode } from "../../src/authority/ProtocolMode";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
} from "../../src/error/ClientAuthError";
import { Logger, LogLevel } from "../../src";

const loggerOptions = {
    loggerCallback: (): void => {},
    piiLoggingEnabled: true,
    logLevel: LogLevel.Verbose,
};
const logger = new Logger(loggerOptions);

describe("AuthorityFactory.ts Class Unit Tests", () => {
    const networkInterface: INetworkModule = {
        sendGetRequestAsync<T>(
            url: string,
            options?: NetworkRequestOptions
        ): T {
            // @ts-ignore
            return null;
        },
        sendPostRequestAsync<T>(
            url: string,
            options?: NetworkRequestOptions
        ): T {
            // @ts-ignore
            return null;
        },
    };

    const mockCache = new MockCache(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto);
    const mockStorage = mockCache.cacheManager;
    let authorityOptions: AuthorityOptions;

    beforeEach(() => {
        authorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
    });

    afterEach(async () => {
        await mockCache.clearCache();
        jest.clearAllMocks();
    });

    it("createDiscoveredInstance calls resolveEndpointsAsync then returns authority", async () => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockResolvedValue();
        const authorityInstance =
            await AuthorityFactory.createDiscoveredInstance(
                Constants.DEFAULT_AUTHORITY,
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
        expect(authorityInstance.authorityType).toBe(AuthorityType.Default);
        expect(authorityInstance instanceof Authority);
        expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
    });

    it("createDiscoveredInstance throws if resolveEndpointsAsync fails", (done) => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockRejectedValue("Discovery failed.");
        AuthorityFactory.createDiscoveredInstance(
            Constants.DEFAULT_AUTHORITY,
            networkInterface,
            mockStorage,
            authorityOptions,
            logger,
            TEST_CONFIG.CORRELATION_ID
        ).catch((e) => {
            expect(e).toBeInstanceOf(ClientAuthError);
            expect(e.errorCode).toBe(
                ClientAuthErrorCodes.endpointResolutionError
            );
            expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it("createDiscoveredInstance transforms CIAM authority", async () => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockResolvedValue();
        const authorityInstance =
            await AuthorityFactory.createDiscoveredInstance(
                "https://test.ciamlogin.com/",
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
        expect(authorityInstance.authorityType).toBe(AuthorityType.Ciam);
        expect(authorityInstance.canonicalAuthority).toBe(
            "https://test.ciamlogin.com/test.onmicrosoft.com/"
        );
        expect(authorityInstance instanceof Authority);
        expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
    });

    it("createDiscoveredInstance transforms CIAM authority when a `/` is missing", async () => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockResolvedValue();
        const authorityInstance =
            await AuthorityFactory.createDiscoveredInstance(
                "https://test.ciamlogin.com",
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
        expect(authorityInstance.authorityType).toBe(AuthorityType.Ciam);
        expect(authorityInstance.canonicalAuthority).toBe(
            "https://test.ciamlogin.com/test.onmicrosoft.com/"
        );
        expect(authorityInstance instanceof Authority);
        expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
    });

    it("createDiscoveredInstance does not transform when there is a PATH", async () => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockResolvedValue();
        const authorityInstance =
            await AuthorityFactory.createDiscoveredInstance(
                "https://test.ciamlogin.com/tenant/",
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
        expect(authorityInstance.authorityType).toBe(AuthorityType.Ciam);
        expect(authorityInstance.canonicalAuthority).toBe(
            "https://test.ciamlogin.com/tenant/"
        );
        expect(authorityInstance instanceof Authority);
        expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
    });

    it("createDiscoveredInstance does not transform when there is a PATH adds a trailing `slash` if not provided", async () => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockResolvedValue();
        const authorityInstance =
            await AuthorityFactory.createDiscoveredInstance(
                "https://test.ciamlogin.com/tenant",
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
        expect(authorityInstance.authorityType).toBe(AuthorityType.Ciam);
        expect(authorityInstance.canonicalAuthority).toBe(
            "https://test.ciamlogin.com/tenant/"
        );
        expect(authorityInstance instanceof Authority);
        expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
    });

    it("createDiscoveredInstance does not tranform CIAM authority when there is a PATH & accounts for existing trailing `slash`", async () => {
        const resolveEndpointsStub = jest
            .spyOn(Authority.prototype, "resolveEndpointsAsync")
            .mockResolvedValue();
        const authorityInstance =
            await AuthorityFactory.createDiscoveredInstance(
                "https://test.ciamlogin.com/e458a5d7-3227-49a6-a1f1-8e5317c8a790/",
                networkInterface,
                mockStorage,
                authorityOptions,
                logger,
                TEST_CONFIG.CORRELATION_ID
            );
        expect(authorityInstance.authorityType).toBe(AuthorityType.Ciam);
        expect(authorityInstance.canonicalAuthority).toBe(
            "https://test.ciamlogin.com/e458a5d7-3227-49a6-a1f1-8e5317c8a790/"
        );
        expect(authorityInstance instanceof Authority);
        expect(resolveEndpointsStub).toHaveBeenCalledTimes(1);
    });
});
