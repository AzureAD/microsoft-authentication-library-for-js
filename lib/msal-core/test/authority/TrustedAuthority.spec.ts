import { expect } from "chai";
import { TEST_CONFIG } from "../TestConstants";
import sinon from "sinon";
import TelemetryManager from "../../src/telemetry/TelemetryManager";
import { TelemetryConfig } from "../../src/telemetry/TelemetryTypes";
import { Logger } from "../../src/Logger";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";

const stubbedTelemetryConfig: TelemetryConfig = {
    clientId: TEST_CONFIG.MSAL_CLIENT_ID,
    platform: {
        applicationName: TEST_CONFIG.applicationName,
        applicationVersion: TEST_CONFIG.applicationVersion
    }
};

const stubbedTelemetryManager = new TelemetryManager(stubbedTelemetryConfig, () => {}, new Logger(() => {}));

describe("TrustedAuthority.ts Class", function () {
    afterEach(function() {
        sinon.restore();
    });

    describe("setTrustedAuthoritiesFromConfig", () => {
        it("Sets TrustedHostList with Known Authorities", async () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns([]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(true, TEST_CONFIG.knownAuthorities);

            TEST_CONFIG.knownAuthorities.forEach(function(authority) {
                expect(TrustedAuthority.IsInTrustedHostList(authority)).to.be.true;
            });
        });

        it("Do not add additional authorities to trusted host list if it has already been populated", async () => {
            sinon.stub(TrustedAuthority, "getTrustedHostList").returns(["login.microsoftonline.com"]);
            TrustedAuthority.setTrustedAuthoritiesFromConfig(true, ["contoso.b2clogin.com"]);

            expect(TrustedAuthority.IsInTrustedHostList("contoso.b2clogin.com")).to.be.false;
        });
    });
});