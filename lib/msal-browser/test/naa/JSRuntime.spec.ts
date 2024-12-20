/**
 * @jest-environment node
 */

import MockBridge from "./MockBridge.js";
import {
    BRIDGE_ERROR_USER_INTERACTION_REQUIRED,
    INIT_CONTEXT_RESPONSE,
    SILENT_TOKEN_RESPONSE,
} from "./BridgeProxyConstants.js";
import { PublicClientNext } from "../../src/app/PublicClientNext.js";
import { TEST_CONFIG, TEST_TOKENS } from "../utils/StringConstants.js";
import { randomFillSync } from "crypto";
import { TokenClaims } from "@azure/msal-common";
import { CacheLookupPolicy } from "../../src/index.js";
import { InteractionRequiredAuthError } from "@azure/msal-common";

/**
 * Tests Nested App Auth for JS Runtime environment
 *
 * JS Runtime environment is simulated, but does not have DOM dependencies and some platform API available.
 * The node environment is the most similar to JS Runtime available to Jest.
 * This is testing E2E Nested App Auth scenario with mock responses.
 */

describe("JS Runtime Nested App Auth", () => {
    let mockBridge: MockBridge;
    const globalObj: any = global;

    function deleteGlobalProperty(name: string) {
        delete globalObj[name];
    }

    beforeAll(() => {
        globalObj.self = globalObj;
        // JS Runtime is not a browser, but does have window defined
        globalObj.window = globalObj;

        // Remove global properties that can be reset after test that don't have full implementations in JS Runtime
        deleteGlobalProperty("crypto");
        deleteGlobalProperty("TextEncoder");
        deleteGlobalProperty("btoa");

        // Add platform API Nested App Auth depends on
        globalObj["crypto"] = {
            getRandomValues(dataBuffer: any) {
                return randomFillSync(dataBuffer);
            },
        };

        mockBridge = new MockBridge();

        // Delete nestedAppAuthBridge so that it can be restored after test
        deleteGlobalProperty("nestedAppAuthBridge");
        globalObj.nestedAppAuthBridge = mockBridge;
    });

    it("Nested App Auth access token can be acquired", async () => {
        mockBridge.addInitContextResponse(
            "GetInitContext",
            INIT_CONTEXT_RESPONSE
        );

        const pca = await PublicClientNext.createPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                supportsNestedAppAuth: true,
            },
        });

        expect(pca.getActiveAccount()).toBe(null);

        // Validate ssoSilent
        mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
        {
            const authResult = await pca.ssoSilent({ scopes: ["User.Read"] });
            const idTokenClaims: TokenClaims = authResult.idTokenClaims;
            expect(authResult.account.homeAccountId).toBe(
                "00000000-0000-0000-66f3-3332eca7ea81.3338040d-6c67-4c5b-b112-36a304b66da"
            );
            expect(idTokenClaims.aud).toBe(
                "6cb04018-a3f5-46a7-b995-940c78f5aef3"
            );
            expect(authResult.fromCache).toBe(false);
            expect(authResult.accessToken).toBe(TEST_TOKENS.ACCESS_TOKEN);
        }

        // Validate acquireTokenSilent
        {
            const authResult = await pca.acquireTokenSilent({
                scopes: ["User.Read"],
                cacheLookupPolicy: CacheLookupPolicy.Default,
            });
            const idTokenClaims: TokenClaims = authResult.idTokenClaims;
            expect(authResult.account.homeAccountId).toBe(
                "00000000-0000-0000-66f3-3332eca7ea81.3338040d-6c67-4c5b-b112-36a304b66da"
            );
            expect(idTokenClaims.aud).toBe(
                "6cb04018-a3f5-46a7-b995-940c78f5aef3"
            );
            expect(authResult.fromCache).toBe(true);
            expect(authResult.accessToken).toBe(TEST_TOKENS.ACCESS_TOKEN);
        }

        // Validate error scenario
        mockBridge.addErrorResponse(
            "GetToken",
            BRIDGE_ERROR_USER_INTERACTION_REQUIRED
        );
        await expect(() =>
            pca.acquireTokenSilent({
                scopes: ["Files.Read"],
            })
        ).rejects.toThrow(InteractionRequiredAuthError);

        // Validate acquireTokenPopup
        mockBridge.addAuthResultResponse(
            "GetTokenPopup",
            SILENT_TOKEN_RESPONSE
        );
        {
            const authResult = await pca.acquireTokenPopup({
                scopes: ["User.Read"],
            });
            const idTokenClaims: TokenClaims = authResult.idTokenClaims;
            expect(authResult.account.homeAccountId).toBe(
                "00000000-0000-0000-66f3-3332eca7ea81.3338040d-6c67-4c5b-b112-36a304b66da"
            );
            expect(idTokenClaims.aud).toBe(
                "6cb04018-a3f5-46a7-b995-940c78f5aef3"
            );
            expect(authResult.fromCache).toBe(false);
            expect(authResult.accessToken).toBe(TEST_TOKENS.ACCESS_TOKEN);
        }
    });
});
