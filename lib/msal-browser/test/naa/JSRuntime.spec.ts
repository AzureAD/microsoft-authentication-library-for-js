/**
 * @jest-environment node
 */

import MockBridge from "./MockBridge";
import {
    INIT_CONTEXT_RESPONSE,
    SILENT_TOKEN_RESPONSE,
} from "./BridgeProxyConstants";
import { PublicClientNext } from "../../src/app/PublicClientNext";
import { TEST_CONFIG, TEST_TOKENS } from "../utils/StringConstants";
import NodeCrypto from "crypto";

/**
 * Tests Nested App Auth for JS Runtime environment
 *
 * JS Runtime environment is simulated, but does not have DOM dependencies and some platform API available.
 * The node environment is the most similar to JS Runtime available to Jest.
 * This is testing E2E Nested App Auth scenario with mock responses.
 */

describe("JS Runtime Nested App Auth", () => {
    let mockBridge: MockBridge;
    const deletedProperties = new Map<string, any>();

    function deleteGlobalProperty(name: string) {
        deletedProperties.set(name, global[name]);
        delete global[name];
    }

    beforeAll(() => {
        let globalObj: any = global;
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
                return NodeCrypto.randomFillSync(dataBuffer);
            },
        };

        mockBridge = new MockBridge();

        // Delete nestedAppAuthBridge so that it can be restored after test
        deleteGlobalProperty("nestedAppAuthBridge");
        globalObj.nestedAppAuthBridge = mockBridge;
    });

    afterAll(() => {
        // Reset global properties
        for (const [name, value] of deletedProperties) {
            if (value === undefined) {
                delete global[name];
            } else {
                global[name] = value;
            }
        }
    });

    it("Nested App Auth access token can be acquired", async () => {
        mockBridge.addInitContextResponse(
            "GetInitContext",
            INIT_CONTEXT_RESPONSE
        );
        mockBridge.addAuthResultResponse("GetToken", SILENT_TOKEN_RESPONSE);
        const pca = await PublicClientNext.createPublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                supportsNestedAppAuth: true,
            },
        });
        const authResult = await pca.ssoSilent({ scopes: ["User.Read"] });
        expect(authResult.account.homeAccountId).toBe(
            "2995ae49-d9dd-409d-8d62-ba969ce58a81.51178b70-16cc-41b5-bef1-ae1808139065"
        );
        expect(authResult.idTokenClaims["aud"]).toBe(
            "6cb04018-a3f5-46a7-b995-940c78f5aef3"
        );
        expect(authResult.accessToken).toBe(TEST_TOKENS.ACCESS_TOKEN);
    });
});
