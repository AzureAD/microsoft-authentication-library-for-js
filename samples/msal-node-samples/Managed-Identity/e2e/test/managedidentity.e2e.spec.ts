/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * End-to-end Managed Identity tests (REAL token acquisition).
 *
 * These tests acquire real ARM tokens using the managed identities assigned to
 * the self-hosted Azure DevOps pools, so they only do meaningful work on those
 * machines:
 *
 *   - IMDS      -> the "MISEManagedIdentity" pool (an Azure VM) with the lab
 *                  system-assigned + user-assigned identities assigned. Gated on
 *                  the MSAL_TEST_MI_IMDS environment variable, which the IMDS
 *                  pipeline stage sets. (An explicit flag is used instead of
 *                  source detection because a hosted agent also reports IMDS.)
 *   - Azure Arc -> the "MISEAZUREARC" pool (an Azure Arc-enabled machine). Gated
 *                  on the Azure Arc source being detected on the machine.
 *
 * They mirror the MSAL Go and MSAL Python Managed Identity E2E tests and use the
 * SAME lab identities and ARM resource, so every SDK exercises the same lab
 * configuration on the same machines.
 *
 * Everywhere else (hosted agents, local dev) the suites self-skip.
 */
import {
    AuthenticationResult,
    ManagedIdentityApplication,
    ManagedIdentityConfiguration,
    ManagedIdentityIdParams,
    ManagedIdentityRequestParams,
    ManagedIdentitySourceNames,
} from "@azure/msal-node";
import { createHash } from "crypto";

// Azure Resource Manager resource. Matches the ARM scope used by the MSAL .NET,
// Go, and Python managed identity E2E tests.
const ARM_RESOURCE: string = "https://management.azure.com";

// User-assigned managed identities assigned to the MISEManagedIdentity VM. These
// are the SAME values used by the MSAL Go / Python / .NET IMDS E2E tests, so all
// SDKs exercise the same lab configuration on the same VM.
const UAMI_CLIENT_ID: string = "6325cd32-9911-41f3-819c-416cdf9104e7";
const UAMI_OBJECT_ID: string = "ecb2ad92-3e30-4505-b79f-ac640d069f24";
const UAMI_RESOURCE_ID: string =
    "/subscriptions/c1686c51-b717-4fe0-9af3-24a20a41fb0c/resourcegroups/" +
    "MSIV2-Testing-MSALNET/providers/Microsoft.ManagedIdentity/userAssignedIdentities/msiv2uami";

/**
 * Hash a token so a failed assertion can compare tokens without ever printing
 * the token material into CI logs.
 */
const sha256Hex = (value: string): string =>
    createHash("sha256").update(value, "utf8").digest("hex");

/** True when running on the IMDS VM pool (the pipeline sets this flag). */
const isImdsPool = (): boolean => Boolean(process.env.MSAL_TEST_MI_IMDS);

/** True when the current machine is detected as Azure Arc-enabled. */
const isAzureArc = (): boolean => {
    try {
        return (
            new ManagedIdentityApplication().getManagedIdentitySource() ===
            ManagedIdentitySourceNames.AZURE_ARC
        );
    } catch {
        return false;
    }
};

/**
 * Acquire an ARM token twice for the given managed identity and assert the first
 * call reaches the identity provider while the second is served from the token
 * cache. Shared by the IMDS and Azure Arc suites, mirroring the Go/Python helper
 * of the same purpose.
 */
const acquireTokenTwiceAssertCaching = async (
    idParams?: ManagedIdentityIdParams
): Promise<void> => {
    const config: ManagedIdentityConfiguration = idParams
        ? { managedIdentityIdParams: idParams }
        : {};
    const managedIdentityApplication = new ManagedIdentityApplication(config);

    const request: ManagedIdentityRequestParams = { resource: ARM_RESOURCE };

    const first: AuthenticationResult =
        await managedIdentityApplication.acquireToken(request);
    expect(first.accessToken).toBeTruthy();
    expect(first.fromCache).toBe(false);

    const second: AuthenticationResult =
        await managedIdentityApplication.acquireToken(request);
    expect(second.accessToken).toBeTruthy();
    expect(second.fromCache).toBe(true);

    // Compare by digest so a mismatch never prints the actual token material.
    expect(sha256Hex(second.accessToken)).toBe(sha256Hex(first.accessToken));
};

const describeImds = isImdsPool() ? describe : describe.skip;
const describeArc = isAzureArc() ? describe : describe.skip;

describeImds("Managed Identity E2E - IMDS (Azure VM)", () => {
    test("system-assigned acquires and caches an ARM token", () =>
        acquireTokenTwiceAssertCaching());

    test("user-assigned (client id) acquires and caches an ARM token", () =>
        acquireTokenTwiceAssertCaching({
            userAssignedClientId: UAMI_CLIENT_ID,
        }));

    test("user-assigned (object id) acquires and caches an ARM token", () =>
        acquireTokenTwiceAssertCaching({
            userAssignedObjectId: UAMI_OBJECT_ID,
        }));

    test("user-assigned (resource id) acquires and caches an ARM token", () =>
        acquireTokenTwiceAssertCaching({
            userAssignedResourceId: UAMI_RESOURCE_ID,
        }));
});

describeArc("Managed Identity E2E - Azure Arc", () => {
    // Azure Arc supports the system-assigned identity only, so unlike the IMDS
    // suite there are no user-assigned variants.
    test("system-assigned acquires and caches an ARM token", () =>
        acquireTokenTwiceAssertCaching());
});
