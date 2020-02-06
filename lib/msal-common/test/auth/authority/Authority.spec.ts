import { expect } from "chai";
import { Authority } from "../../../src/auth/authority/Authority";
import { INetworkModule, NetworkRequestOptions } from "../../../src/network/INetworkModule";
import { Constants } from "../../../src/utils/Constants";
import { AuthorityType } from "../../../src/auth/authority/AuthorityType";
import { DEFAULT_TENANT_DISCOVERY_RESPONSE } from "../../utils/StringConstants";
import { ClientConfigurationErrorMessage } from "../../../src/error/ClientConfigurationError";

class TestAuthority extends Authority {
    public get authorityType(): AuthorityType {
        return null;
    }    
    
    public async getOpenIdConfigurationEndpointAsync(): Promise<string> {
        return DEFAULT_TENANT_DISCOVERY_RESPONSE.tenant_discovery_endpoint;
    }
};

describe("Authority.ts Class Unit Tests", () => {
    
    describe("Constructor", () => {

        it("Creates canonical authority uri based on given uri (and normalizes with '/')", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };
            const authority = new TestAuthority(Constants.DEFAULT_AUTHORITY, networkInterface);
            expect(authority.canonicalAuthority).to.be.eq(`${Constants.DEFAULT_AUTHORITY}/`);
        });

        it("Throws error if URI is not in valid format", () => {
            const networkInterface: INetworkModule = {
                sendGetRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                },
                sendPostRequestAsync<T>(url: string, options?: NetworkRequestOptions): T {
                    return null;
                }
            };
            
            expect(() => new TestAuthority(`http://login.microsoftonline.com/common`, networkInterface)).to.throw(ClientConfigurationErrorMessage.authorityUriInsecure.desc);
            expect(() => new TestAuthority(`https://login.microsoftonline.com/`, networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
            expect(() => new TestAuthority("This is not a URI", networkInterface)).to.throw(ClientConfigurationErrorMessage.urlParseError.desc);
        });
    });

    describe("Getters and setters", () => {

    });

    describe("Endpoint discovery", () => {

    });
});
