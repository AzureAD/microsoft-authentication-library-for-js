import { expect } from "chai";
import { AadAuthority } from "../../../src/auth/authority/AadAuthority";
import { Constants } from "../../../src/utils/Constants";
import { INetworkModule, NetworkRequestOptions } from "../../../src/network/INetworkModule";
import { Authority } from "../../../src/auth/authority/Authority";
import { AuthorityType } from "../../../src/auth/authority/AuthorityType";
import { TEST_HOST_LIST, DEFAULT_TENANT_DISCOVERY_RESPONSE, TEST_TENANT_DISCOVERY_RESPONSE } from "../../utils/StringConstants";
import sinon from "sinon";

describe("AadAuthority.ts Class Unit Tests", () => {
    
    describe("Constructor", () => {

        let aadAuthority: AadAuthority;
        beforeEach(() => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };

            aadAuthority = new AadAuthority(Constants.DEFAULT_AUTHORITY, networkInterface);
        });

        it("Creates an AadAuthority that extends the Authority class", () => {
            expect(aadAuthority).to.be.not.null;
            expect(aadAuthority instanceof AadAuthority).to.be.true;
            expect(aadAuthority instanceof Authority).to.be.true;
        });

        it("Creates an Authority with type Aad", () => {
            expect(aadAuthority.authorityType).to.be.eq(AuthorityType.Aad);
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

            // Can't use foreach here because test passes even in error case
            for (let i = 0; i < TEST_HOST_LIST.length; i++) {
                const hostUri = TEST_HOST_LIST[i];
                const aadAuthority = new AadAuthority(`https://${hostUri}/common`, networkInterface);
                await expect(aadAuthority.getOpenIdConfigurationEndpointAsync()).to.eventually.eq(`https://${hostUri}/common/v2.0/.well-known/openid-configuration`);
            } 
        });

        it("Makes a request to get OpenID endpoint if given authority is NOT in trusted host list", async () => {
            // Can't use sinon here since INetworkModule is an interface, so using variables here instead
            let numCalls = 0;
            const hostUri = "https://login.contoso.com/tenant-id";
            const networkInterface: INetworkModule = {
                sendGetRequestAsync(url: string, options?: NetworkRequestOptions): any {
                    numCalls++;
                    switch (url) {
                        case `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}?api-version=1.0&authorization_endpoint=${hostUri}/oauth2/v2.0/authorize`:
                            return TEST_TENANT_DISCOVERY_RESPONSE;
                        default:
                            return null;
                    }
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };
            const aadAuthority = new AadAuthority(hostUri, networkInterface);

            await expect(aadAuthority.getOpenIdConfigurationEndpointAsync()).to.eventually.eq(TEST_TENANT_DISCOVERY_RESPONSE.tenant_discovery_endpoint);
            expect(numCalls).to.be.eq(1);
        });
    });
});
