import { AADAuthorityConstants, StaticAuthorityOptions } from "../../src";
import {
    InstanceDiscoveryMetadata,
    getAliasesFromStaticSources,
} from "../../src/authority/AuthorityMetadata";
import {
    CLOUD_HOSTS,
    METADATA_ALIASES,
    TEST_CONFIG,
} from "../test_kit/StringConstants";

function buildCanonicalAuthorityUrl(host: string, tenant: string): string {
    return `https://${host}/${tenant}/`;
}

const TENANTS = [
    ...Object.values(AADAuthorityConstants),
    TEST_CONFIG.MSAL_TENANT_ID,
];
const CLOUD_KEYS = Object.keys(CLOUD_HOSTS);

describe("AuthorityMetadata.ts Unit Tests", () => {
    describe("getAliasesFromStaticSources()", () => {
        describe("from config CloudDiscoveryMetadataResponse", () => {
            const staticAuthorityOptions: StaticAuthorityOptions = {
                cloudDiscoveryMetadata: InstanceDiscoveryMetadata,
            };
            it("returns aliases for each cloud and tenant combination", () => {
                CLOUD_KEYS.forEach((cloudKey) => {
                    TENANTS.forEach((tenant) => {
                        staticAuthorityOptions.canonicalAuthority =
                            buildCanonicalAuthorityUrl(
                                CLOUD_HOSTS[cloudKey],
                                tenant
                            );
                        expect(
                            getAliasesFromStaticSources(staticAuthorityOptions)
                        ).toEqual(METADATA_ALIASES[cloudKey]);
                    });
                });
            });
        });

        describe("from hardcoded CloudDiscoveryMetadataResponse", () => {
            it("returns aliases for each cloud and tenant combination", () => {
                CLOUD_KEYS.forEach((cloudKey) => {
                    TENANTS.forEach((tenant) => {
                        const staticAuthorityOptions = {
                            canonicalAuthority: buildCanonicalAuthorityUrl(
                                CLOUD_HOSTS[cloudKey],
                                tenant
                            ),
                        };
                        console.log(staticAuthorityOptions);
                        expect(
                            getAliasesFromStaticSources(staticAuthorityOptions)
                        ).toEqual(METADATA_ALIASES[cloudKey]);
                    });
                });
            });
        });
    });
});
