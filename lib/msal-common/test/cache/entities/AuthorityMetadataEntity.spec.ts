import { expect } from "chai";
import { Constants, TimeUtils } from "../../../src";
import { AuthorityMetadataEntity } from "../../../src/cache/entities/AuthorityMetadataEntity";
import { DEFAULT_OPENID_CONFIG_RESPONSE, TEST_CONFIG } from "../../test_kit/StringConstants";

describe("AuthorityMetadataEntity.ts Unit Tests", () => {
    const key = `authority-metadata-${TEST_CONFIG.MSAL_CLIENT_ID}-${Constants.DEFAULT_AUTHORITY_HOST}`;
    const testObj: object = {
        aliases: [Constants.DEFAULT_AUTHORITY_HOST],
        preferred_cache: Constants.DEFAULT_AUTHORITY_HOST,
        preferred_network: Constants.DEFAULT_AUTHORITY_HOST,
        canonical_authority: Constants.DEFAULT_AUTHORITY,
        authorization_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint,
        token_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint,
        end_session_endpoint: DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint,
        issuer: DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer,
        aliasesFromNetwork: false,
        endpointsFromNetwork: false,
        expiresAt: TimeUtils.nowSeconds()
    };

    it("Verify if an object is a AuthorityMetadataEntity", () => {
        expect(AuthorityMetadataEntity.isAuthorityMetadataEntity(key, testObj)).to.be.true;
    });

    it("Verify an object is not a AuthorityMetadataEntity", () => {
        expect(AuthorityMetadataEntity.isAuthorityMetadataEntity(key, null)).to.be.false;
        expect(AuthorityMetadataEntity.isAuthorityMetadataEntity(key, {})).to.be.false;
        expect(AuthorityMetadataEntity.isAuthorityMetadataEntity("not-a-real-key", testObj)).to.be.false;

        Object.keys(testObj).forEach((key) => {
            const incompleteTestObject = {...testObj};
            delete incompleteTestObject[key];

            expect(AuthorityMetadataEntity.isAuthorityMetadataEntity(key, incompleteTestObject)).to.be.false;
        });
    });
});
