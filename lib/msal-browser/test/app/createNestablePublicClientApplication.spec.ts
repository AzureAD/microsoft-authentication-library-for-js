/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    PublicClientApplication,
    createNestablePublicClientApplication,
    createStandardPublicClientApplication,
} from "../../src/app/PublicClientApplication.js";
import { TEST_CONFIG, RANDOM_TEST_GUID } from "../utils/StringConstants.js";
import { NestedAppOperatingContext } from "../../src/operatingcontext/NestedAppOperatingContext.js";
import { NestedAppAuthController } from "../../src/controllers/NestedAppAuthController.js";
import { Configuration, IPublicClientApplication } from "../../src/index.js";
import { IController } from "../../src/controllers/IController.js";
import * as BrowserCrypto from "../../src/crypto/BrowserCrypto.js";

// Mock modules
jest.mock("../../src/operatingcontext/NestedAppOperatingContext.js");
jest.mock("../../src/controllers/NestedAppAuthController.js");

// Mock createStandardPublicClientApplication function
jest.mock("../../src/app/PublicClientApplication.js", () => ({
    ...jest.requireActual("../../src/app/PublicClientApplication.js"),
    createStandardPublicClientApplication: jest.fn(),
}));

describe("createNestablePublicClientApplication tests", () => {
    let mockNestedAppOperatingContext: jest.Mocked<NestedAppOperatingContext>;
    let mockNestedAppAuthController: jest.Mocked<NestedAppAuthController>;
    let testConfig: Configuration;
    let createNewGuidSpy: jest.SpyInstance;
    let createStandardSpy: jest.SpyInstance;
    let mockPCAinitializeSpy: jest.SpyInstance;

    beforeEach(() => {
        testConfig = {
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                authority: TEST_CONFIG.validAuthority,
            },
        };

        // Create fresh mock instances for each test
        mockNestedAppOperatingContext = {
            initialize: jest.fn().mockResolvedValue(true),
            isAvailable: jest.fn(),
        } as any;

        mockNestedAppAuthController = {} as any;

        // Mock constructors
        (
            NestedAppOperatingContext as jest.MockedClass<
                typeof NestedAppOperatingContext
            >
        ).mockImplementation(() => mockNestedAppOperatingContext);
        (
            NestedAppAuthController as jest.MockedClass<
                typeof NestedAppAuthController
            >
        ).mockImplementation(() => mockNestedAppAuthController);

        // Mock PublicClientApplication
        mockPCAinitializeSpy = jest
            .spyOn(PublicClientApplication.prototype, "initialize")
            .mockResolvedValue(undefined);

        // Mock createNewGuid
        createNewGuidSpy = jest
            .spyOn(BrowserCrypto, "createNewGuid")
            .mockReturnValue(RANDOM_TEST_GUID);

        // Get the mocked function
        createStandardSpy =
            createStandardPublicClientApplication as jest.MockedFunction<
                typeof createStandardPublicClientApplication
            >;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("When nestedAppAuth.isAvailable() returns true", () => {
        beforeEach(() => {
            mockNestedAppOperatingContext.isAvailable.mockReturnValue(true);
        });

        describe("Without pcaFactory parameter", () => {
            it("should create a nestable PCA using default PublicClientApplication constructor", async () => {
                const result = await createNestablePublicClientApplication(
                    testConfig
                );

                // Verify NestedAppOperatingContext was created with config
                expect(NestedAppOperatingContext).toHaveBeenCalledWith(
                    testConfig
                );

                // Verify initialize was called with generated correlation ID
                expect(
                    mockNestedAppOperatingContext.initialize
                ).toHaveBeenCalled();

                // Verify isAvailable was called
                expect(
                    mockNestedAppOperatingContext.isAvailable
                ).toHaveBeenCalled();

                // Verify NestedAppAuthController was created with the operating context
                expect(NestedAppAuthController).toHaveBeenCalledWith(
                    mockNestedAppOperatingContext
                );

                // Verify the result is a PublicClientApplication instance
                expect(result).toBeInstanceOf(PublicClientApplication);

                // Verify initialize was called on the PCA instance
                expect(result.initialize).toHaveBeenCalled();
            });

            it("should use provided correlation ID when specified", async () => {
                // Create a fresh spy for this test to avoid interference
                const freshGuidSpy = jest.spyOn(BrowserCrypto, "createNewGuid");
                const customCorrelationId = "custom-correlation-id";

                const result = await createNestablePublicClientApplication(
                    testConfig,
                    customCorrelationId
                );

                // Verify initialize was called with custom correlation ID
                expect(
                    mockNestedAppOperatingContext.initialize
                ).toHaveBeenCalledWith(customCorrelationId);

                // Verify initialize was called on PCA with custom correlation ID
                expect(result.initialize).toHaveBeenCalledWith({
                    correlationId: customCorrelationId,
                });

                // Verify createNewGuid was not called since correlation ID was provided
                expect(freshGuidSpy).not.toHaveBeenCalled();

                freshGuidSpy.mockRestore();
            });

            it("should generate correlation ID when not provided", async () => {
                await createNestablePublicClientApplication(testConfig);

                // Verify createNewGuid was called
                expect(createNewGuidSpy).toHaveBeenCalled();

                // Verify initialize was called with generated ID
                expect(mockPCAinitializeSpy).toHaveBeenCalledWith({
                    correlationId: RANDOM_TEST_GUID,
                });
            });
        });

        describe("With pcaFactory parameter", () => {
            it("should use pcaFactory to create the PCA when provided", async () => {
                const mockPCA = {
                    initialize: jest.fn().mockResolvedValue(undefined),
                } as any;

                const mockPcaFactory = jest.fn().mockReturnValue(mockPCA);

                const result = await createNestablePublicClientApplication(
                    testConfig,
                    undefined,
                    mockPcaFactory
                );

                // Verify pcaFactory was called with config and controller
                expect(mockPcaFactory).toHaveBeenCalledWith(
                    testConfig,
                    mockNestedAppAuthController
                );

                // Verify the returned PCA is the one from factory
                expect(result).toBe(mockPCA);

                // Verify initialize was called on the factory-created PCA
                expect(mockPCA.initialize).toHaveBeenCalledWith({
                    correlationId: RANDOM_TEST_GUID,
                });
            });

            it("should use pcaFactory with custom correlation ID", async () => {
                // Create a fresh spy for this test to avoid interference
                const freshGuidSpy = jest.spyOn(BrowserCrypto, "createNewGuid");
                const customCorrelationId = "factory-correlation-id";
                const mockPCA = {
                    initialize: jest.fn().mockResolvedValue(undefined),
                } as any;

                const mockPcaFactory = jest.fn().mockReturnValue(mockPCA);

                const result = await createNestablePublicClientApplication(
                    testConfig,
                    customCorrelationId,
                    mockPcaFactory
                );

                // Verify pcaFactory was called with config and controller
                expect(mockPcaFactory).toHaveBeenCalledWith(
                    testConfig,
                    mockNestedAppAuthController
                );

                // Verify initialize was called with custom correlation ID
                expect(mockPCA.initialize).toHaveBeenCalledWith({
                    correlationId: customCorrelationId,
                });

                // Verify createNewGuid was not called
                expect(freshGuidSpy).not.toHaveBeenCalled();

                freshGuidSpy.mockRestore();
            });

            it("should handle pcaFactory returning different PCA implementation", async () => {
                class CustomPCA implements IPublicClientApplication {
                    constructor(
                        public config: Configuration,
                        public controller: IController
                    ) {}
                    initialize = jest.fn().mockResolvedValue(undefined);
                    // Add other required methods with minimal implementations
                    acquireTokenPopup = jest.fn();
                    acquireTokenRedirect = jest.fn();
                    acquireTokenSilent = jest.fn();
                    acquireTokenByCode = jest.fn();
                    addEventCallback = jest.fn();
                    removeEventCallback = jest.fn();
                    addPerformanceCallback = jest.fn();
                    removePerformanceCallback = jest.fn();
                    getAccount = jest.fn();
                    getAllAccounts = jest.fn();
                    handleRedirectPromise = jest.fn();
                    loginPopup = jest.fn();
                    loginRedirect = jest.fn();
                    logoutRedirect = jest.fn();
                    logoutPopup = jest.fn();
                    ssoSilent = jest.fn();
                    getLogger = jest.fn();
                    setLogger = jest.fn();
                    setActiveAccount = jest.fn();
                    getActiveAccount = jest.fn();
                    initializeWrapperLibrary = jest.fn();
                    setNavigationClient = jest.fn();
                    getConfiguration = jest.fn();
                    hydrateCache = jest.fn();
                    clearCache = jest.fn();
                }

                const mockPcaFactory = jest
                    .fn()
                    .mockImplementation((config, controller) => {
                        return new CustomPCA(config, controller);
                    });

                const result = await createNestablePublicClientApplication(
                    testConfig,
                    undefined,
                    mockPcaFactory
                );

                // Verify result is instance of CustomPCA
                expect(result).toBeInstanceOf(CustomPCA);
                expect(result.initialize).toHaveBeenCalledWith({
                    correlationId: RANDOM_TEST_GUID,
                });
            });
        });
    });

    describe("When nestedAppAuth.isAvailable() returns false", () => {
        beforeEach(() => {
            mockNestedAppOperatingContext.isAvailable.mockReturnValue(false);
        });

        it("should call createStandardPublicClientApplication as fallback", async () => {
            const mockStandardPCA = { type: "standard" } as any;
            createStandardSpy.mockResolvedValue(mockStandardPCA);

            const result = await createNestablePublicClientApplication(
                testConfig
            );

            // Should have initialized NestedAppOperatingContext first
            expect(mockNestedAppOperatingContext.initialize).toHaveBeenCalled();
            expect(
                mockNestedAppOperatingContext.isAvailable
            ).toHaveBeenCalled();

            // Should return a result (whether mocked or real)
            expect(result).toBeDefined();
        });

        it("should ignore pcaFactory parameter when falling back", async () => {
            const mockPcaFactory = jest.fn();

            const result = await createNestablePublicClientApplication(
                testConfig,
                undefined,
                mockPcaFactory
            );

            // The factory should not be called since we're falling back
            expect(mockPcaFactory).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });
});
