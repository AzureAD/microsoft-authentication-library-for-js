/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ManagedIdentityApplication } from "../../src/client/ManagedIdentityApplication";
import { ManagedIdentityConfiguration } from "../../src/config/Configuration";
import { ManagedIdentityRequestParams } from "../../src/request/ManagedIdentityRequestParams";
import {
    DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT,
    MANAGED_IDENTITY_CLIENT_ID,
    MANAGED_IDENTITY_RESOURCE,
} from "../test_kit/StringConstants";

import { ManagedIdentityTestUtils } from "../test_kit/ManagedIdentityTestUtils";
import {
    DEFAULT_MANAGED_IDENTITY_ID,
    ManagedIdentityIdType,
} from "../../src/utils/Constants";

describe("ManagedIdentityApplication unit tests", () => {
    const OLD_ENVS = process.env;

    const managedIdentityRequestParams: ManagedIdentityRequestParams = {
        resource: MANAGED_IDENTITY_RESOURCE,
    };

    const nonSystemAssignedConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient:
                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                    MANAGED_IDENTITY_CLIENT_ID
                ),
        },
        managedIdentityIdParams: {
            userAssignedClientId: MANAGED_IDENTITY_CLIENT_ID,
            // or
            // userAssignedResourceId?: string;
            // or
            // userAssignedObjectId?: string;
        },
    };

    const systemAssignedConfig: ManagedIdentityConfiguration = {
        system: {
            networkClient:
                ManagedIdentityTestUtils.getManagedIdentityNetworkClient(
                    DEFAULT_MANAGED_IDENTITY_ID
                ),
            // managedIdentityIdParams will be omitted for system-assigned
        },
    };

    afterEach(() => {
        process.env = OLD_ENVS; // Restore old environment
    });

    describe("Constructor", () => {
        it("creates a ClientCredentialClient", async () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );
            expect(managedIdentityApplication).not.toBeNull();
            expect(
                managedIdentityApplication instanceof ManagedIdentityApplication
            ).toBe(true);
        });
    });

    describe("Acquires a token successfully via an App Service Managed Identity", () => {
        beforeAll(() => {
            process.env = { ...OLD_ENVS }; // Make a copy
            process.env["IdentityHeader"] = "fake_IdentityHeader";
            process.env["IdentityEndpoint"] = "fake_IdentityEndpoint";
        });

        afterAll(() => {
            process.env = OLD_ENVS; // Restore old environment
        });

        test("acquires a Non-System-Assigned token", async () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                nonSystemAssignedConfig
            );

            const networkManagedIdentityResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getId
            ).toEqual(MANAGED_IDENTITY_CLIENT_ID);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getIdType
            ).toEqual(ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId
                    .getIsUserAssignedId
            ).toEqual(true);
        });

        test("acquires a System-Assigned token", async () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );

            const networkManagedIdentityResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getId
            ).toEqual(DEFAULT_MANAGED_IDENTITY_ID);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getIdType
            ).toEqual(ManagedIdentityIdType.SYSTEM_ASSIGNED);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId
                    .getIsUserAssignedId
            ).toEqual(false);
        });

        // TODO: this test only works when the others are commented out. They must be polluting each other somehow?
        test.skip("acquires a System-Assigned token, then returns it from the cache when another acquireToken call is made", async () => {
            const managedIdentityApplication = new ManagedIdentityApplication(
                systemAssignedConfig
            );

            const networkManagedIdentityResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );

            expect(networkManagedIdentityResult.accessToken).toEqual(
                DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getId
            ).toEqual(DEFAULT_MANAGED_IDENTITY_ID);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getIdType
            ).toEqual(ManagedIdentityIdType.SYSTEM_ASSIGNED);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId
                    .getIsUserAssignedId
            ).toEqual(false);

            // wait two seconds for the token to be saved to the cache, before checking the cache for the token
            await new Promise<void>((resolve) => {
                let counter: number = 0;
                const interval = setInterval(() => {
                    if (counter === 2000) {
                        resolve();
                        clearInterval(interval);
                    } else {
                        counter++;
                    }
                }, 1); // 1 millisecond
            });

            const cacheManagedIdentityResult =
                await managedIdentityApplication.acquireToken(
                    managedIdentityRequestParams
                );
            expect(cacheManagedIdentityResult.fromCache).toBe(true);
            expect(cacheManagedIdentityResult.accessToken).toEqual(
                DEFAULT_MANAGED_IDENTITY_AUTHENTICATION_RESULT.accessToken
            );
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getId
            ).toEqual(DEFAULT_MANAGED_IDENTITY_ID);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId.getIdType
            ).toEqual(ManagedIdentityIdType.SYSTEM_ASSIGNED);
            expect(
                managedIdentityApplication.getConfig.managedIdentityId
                    .getIsUserAssignedId
            ).toEqual(false);
        });
    });
});
