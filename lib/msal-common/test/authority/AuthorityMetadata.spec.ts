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
import { EndpointMetadata } from "../../src/authority/AuthorityMetadata";

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
        describe("buildOpenIdConfig (indirect via EndpointMetadata)", () => {
            const requiredKeys = [
                "token_endpoint",
                "jwks_uri",
                "issuer",
                "authorization_endpoint",
                "end_session_endpoint",
            ];

            it("generates expected endpoints for each host", () => {
                Object.entries(EndpointMetadata).forEach(
                    ([host, cfg]: [string, any]) => {
                        // All required keys exist
                        requiredKeys.forEach((k) => {
                            expect((cfg as any)[k]).toBeDefined();
                        });

                        // Shared patterns
                        expect(cfg.token_endpoint).toBe(
                            `https://${host}/{tenantid}/oauth2/v2.0/token`
                        );
                        expect(cfg.jwks_uri).toBe(
                            `https://${host}/{tenantid}/discovery/v2.0/keys`
                        );
                        expect(cfg.authorization_endpoint).toBe(
                            `https://${host}/{tenantid}/oauth2/v2.0/authorize`
                        );
                        expect(cfg.end_session_endpoint).toBe(
                            `https://${host}/{tenantid}/oauth2/v2.0/logout`
                        );

                        // Issuer pattern (may differ for specific hosts)
                        if (host === "login.chinacloudapi.cn") {
                            expect(cfg.issuer).toBe(
                                `https://login.partner.microsoftonline.cn/{tenantid}/v2.0`
                            );
                        } else {
                            expect(cfg.issuer).toBe(
                                `https://${host}/{tenantid}/v2.0`
                            );
                        }
                    }
                );
            });

            it("uses partner host for China authority endpoint metadata", () => {
                const preferredChinaConfig =
                    EndpointMetadata["login.partner.microsoftonline.cn"];
                expect(preferredChinaConfig).toBeDefined();
                expect(preferredChinaConfig.issuer).toBe(
                    "https://login.partner.microsoftonline.cn/{tenantid}/v2.0"
                );
                expect(preferredChinaConfig.token_endpoint).toContain(
                    "login.partner.microsoftonline.cn"
                );
                expect(preferredChinaConfig.authorization_endpoint).toContain(
                    "login.partner.microsoftonline.cn"
                );

                Object.entries(EndpointMetadata).forEach(
                    ([host, cfg]: [string, any]) => {
                        if (host !== "login.partner.microsoftonline.cn") {
                            expect(cfg.issuer).toBe(
                                `https://${host}/{tenantid}/v2.0`
                            );
                            expect(
                                cfg.issuer.includes(
                                    "partner.microsoftonline.cn"
                                )
                            ).toBe(false);
                        }
                    }
                );
            });

            it("all issuer values end with /{tenantid}/v2.0", () => {
                Object.values(EndpointMetadata).forEach((cfg: any) => {
                    expect(cfg.issuer.endsWith("/{tenantid}/v2.0")).toBe(true);
                });
            });
        });
    });
});
