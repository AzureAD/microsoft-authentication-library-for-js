import { expect } from "chai";
import { INetworkModule, NetworkRequestOptions } from "../../src/network/INetworkModule";
import { TEST_CONFIG } from "../utils/StringConstants";
import { B2cAuthority } from "../../src/authority/B2cAuthority";
import { Authority } from "../../src/authority/Authority";
import { AuthorityType } from "../../src/authority/AuthorityType";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";

describe("B2cAuthority.ts Class Unit Tests", () => {

    afterEach(() => {
        // Reinitializes the B2C Trusted Host List between tests
        while (B2cAuthority.B2CTrustedHostList.length) {
            B2cAuthority.B2CTrustedHostList.pop();
        }
    });

    describe("Constructor", () => {

        let b2cAuthority: B2cAuthority;
        beforeEach(() => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };
            B2cAuthority.setKnownAuthorities(["fabrikamb2c.b2clogin.com"]);
            b2cAuthority = new B2cAuthority(TEST_CONFIG.b2cValidAuthority, networkInterface);
        });

        it("Creates an B2cAuthority that extends the Authority class", () => {
            expect(b2cAuthority).to.be.not.null;
            expect(b2cAuthority instanceof B2cAuthority).to.be.true;
            expect(b2cAuthority instanceof Authority).to.be.true;
        });

        it("Creates an Authority with type B2C", () => {
            expect(b2cAuthority.authorityType).to.be.eq(AuthorityType.B2C);
        });
    });

    describe("Public APIs", () => {

        it("Returns default OpenID endpoint if the given authority is in the trusted host list", async () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };

            B2cAuthority.setKnownAuthorities(["fabrikamb2c.b2clogin.com"]);
            const b2cAuthority = new B2cAuthority(TEST_CONFIG.b2cValidAuthority, networkInterface);
            await expect(b2cAuthority.getOpenIdConfigurationEndpointAsync()).to.eventually.eq(`${TEST_CONFIG.b2cValidAuthority}/v2.0/.well-known/openid-configuration`);
        });

        it("Throws Untrusted Authority Error if the given authority was not passed to knownAuthorities", async() => {
            // Can't use sinon here since INetworkModule is an interface, so using variables here instead
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };

            const hostUri = "https://contoso.b2clogin.com/contoso.onmicrosoft.com/b2c_1_susi";
            const b2cAuthority = new B2cAuthority(hostUri, networkInterface);
            try{
                await b2cAuthority.getOpenIdConfigurationEndpointAsync();
            }
            catch(e) {
                expect(e).to.be.instanceOf(ClientConfigurationError);
                expect(e.errorCode).to.be.equal(ClientConfigurationErrorMessage.untrustedAuthority.code);
                expect(e.errorMessage).to.be.equal(ClientConfigurationErrorMessage.untrustedAuthority.desc);
            }
        });
    });
});