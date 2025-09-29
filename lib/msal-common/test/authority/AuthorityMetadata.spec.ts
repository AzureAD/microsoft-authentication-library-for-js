import { StaticAuthorityOptions, Constants, LogLevel, Logger } from "../../src";
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
    ...Object.values(Constants.AADAuthority),
    TEST_CONFIG.MSAL_TENANT_ID,
];
const CLOUD_KEYS = Object.keys(CLOUD_HOSTS);

const loggerOptions = {
    loggerCallback: (): void => {},
    piiLoggingEnabled: true,
    logLevel: LogLevel.Verbose,
};
const logger = new Logger(loggerOptions);

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
                            getAliasesFromStaticSources(
                                staticAuthorityOptions,
                                logger,
                                TEST_CONFIG.CORRELATION_ID
                            )
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
                        expect(
                            getAliasesFromStaticSources(
                                staticAuthorityOptions,
                                logger,
                                TEST_CONFIG.CORRELATION_ID
                            )
                        ).toEqual(METADATA_ALIASES[cloudKey]);
                    });
                });
            });
        });
    });
});
