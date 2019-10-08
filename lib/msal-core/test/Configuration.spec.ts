import { expect } from "chai";
import { buildConfiguration, Configuration } from "../src/Configuration";
import { Logger } from "../src/Logger";

describe("Configuration.ts Type", () => {
    it("buildConfiguration defaults", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        expect(configWithDefaults.hasOwnProperty("cache")).to.be.true;
        expect(configWithDefaults.hasOwnProperty("system")).to.be.true;
        expect(configWithDefaults.hasOwnProperty("framework")).to.be.true;
    });
    it("buildConfiguration auth defaults", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { auth } = configWithDefaults;
        expect(auth.validateAuthority).to.be.true;
    });
    it("buildConfiguration respects auth passed in", () => {
        const fake_state = "fake";
        const fake_validateAuthority = false;
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal",
                validateAuthority: fake_validateAuthority
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { auth } = configWithDefaults;
        expect(auth.validateAuthority).to.eq(fake_validateAuthority);
    });
    it("buildConfiguration cache defaults", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
            cache: {}
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { cache } = configWithDefaults;
        expect(cache.cacheLocation).to.eq("sessionStorage");
        expect(cache.storeAuthStateInCookie).to.be.false;
    });
    it("buildConfiguration respects cache passed in", () => {
        const fake_cacheLocation = "localStorage";
        const fake_storeAuthStateInCookie = true;
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
            cache: {
                cacheLocation: fake_cacheLocation,
                storeAuthStateInCookie: fake_storeAuthStateInCookie
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { cache } = configWithDefaults;
        expect(cache.cacheLocation).to.eq(fake_cacheLocation);
        expect(cache.storeAuthStateInCookie).to.eq(fake_storeAuthStateInCookie);
    });
    it("buildConfiguration system defaults", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { system } = configWithDefaults;
        expect(system.logger).to.not.be.null;
        expect(system.tokenRenewalOffsetSeconds).to.eq(300);
    });
    it("buildConfiguration system defaults", () => {
        const fake_logger = new Logger(console.log);
        const fake_tokenOffset = 500;
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
            system: {
                logger: fake_logger,
                tokenRenewalOffsetSeconds: fake_tokenOffset
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { system } = configWithDefaults;
        expect(system.logger).to.eq(fake_logger);
        expect(system.tokenRenewalOffsetSeconds).to.eq(fake_tokenOffset);
    });
    it("buildConfiguration framework defaults", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { framework } = configWithDefaults;
        expect(framework.isAngular).to.be.false;
    });
    it("buildConfiguration framework defaults", () => {
        const fake_isAngular = true;
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
            framework: {
                isAngular: fake_isAngular
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { framework } = configWithDefaults;
        expect(framework.isAngular).to.eq(fake_isAngular);
    });
    it("does not set defaults for telemetry object", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { system } = configWithDefaults;
        expect(system.telemetry).to.be.undefined;
    });
    it("does not set defaults for telemetry object memebers", () => {
        const config: Configuration = {
            auth: {
                clientId: "iamnotreal"
            },
            system: {
                telemetry: {
                    // @ts-ignore
                    a: true
                }
            }
        };
        const configWithDefaults: Configuration = buildConfiguration(config);
        const { system } = configWithDefaults;
        // @ts-ignore
        expect(system.telemetry.a).to.be.true;
        expect(system.telemetry.applicationName).to.be.undefined;
        expect(Object.keys(system.telemetry).length).to.eq(1);
    });
});
