import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../../test_kit/StringConstants";
import {
    DEFAULT_AUTHORITY_HOST,
    DEFAULT_AUTHORITY,
} from "../../../src/utils/Constants";
import * as TimeUtils from "../../../src/utils/TimeUtils";
import { CacheHelpers } from "../../../src";

describe("AuthorityMetadataEntity.ts Unit Tests", () => {
    const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${DEFAULT_AUTHORITY_HOST}`;
    const testObj: object = {
        aliases: [DEFAULT_AUTHORITY_HOST],
        preferred_cache: DEFAULT_AUTHORITY_HOST,
        preferred_network: DEFAULT_AUTHORITY_HOST,
        canonical_authority: DEFAULT_AUTHORITY,
        authorization_endpoint:
            DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
        token_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
        end_session_endpoint:
            DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint,
        issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
        jwks_uri: DEFAULT_OPENID_CONFIG_RESPONSE.body.jwks_uri,
        aliasesFromNetwork: false,
        endpointsFromNetwork: false,
        expiresAt: TimeUtils.nowSeconds(),
    };

    it("Verify if an object is a AuthorityMetadataEntity", () => {
        expect(CacheHelpers.isAuthorityMetadataEntity(key, testObj)).toBe(true);
    });

    it("Verify if an object is a AuthorityMetadataEntity (without end_session_endpoint)", () => {
        const metadata = {
            ...testObj,
        };
        delete metadata["end_session_endpoint"];
        expect(CacheHelpers.isAuthorityMetadataEntity(key, metadata)).toBe(
            true
        );
    });

    it("Verify an object is not a AuthorityMetadataEntity", () => {
        expect(
            // @ts-ignore
            CacheHelpers.isAuthorityMetadataEntity(key, null)
        ).toBe(false);
        expect(CacheHelpers.isAuthorityMetadataEntity(key, {})).toBe(false);
        expect(
            CacheHelpers.isAuthorityMetadataEntity("not-a-real-key", testObj)
        ).toBe(false);

        Object.keys(testObj).forEach((key) => {
            const incompleteTestObject = { ...testObj };
            delete incompleteTestObject[key];

            expect(
                CacheHelpers.isAuthorityMetadataEntity(
                    key,
                    incompleteTestObject
                )
            ).toBe(false);
        });
    });
});
