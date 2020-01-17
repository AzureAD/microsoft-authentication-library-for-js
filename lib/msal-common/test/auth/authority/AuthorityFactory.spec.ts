import { expect } from "chai";
import { AuthorityFactory } from "../../../src/auth/authority/AuthorityFactory";
import { INetworkModule, NetworkRequestOptions } from "../../../src/network/INetworkModule";

describe("AuthorityFactory.ts Class Unit Tests", () => {

    const sampleNetworkInterface: INetworkModule = {
        
        sendGetRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
            console.log("Url: " + url);
            console.log("Request options: " + JSON.stringify(options));
        },
        sendPostRequestAsync: async (url: string, options?: NetworkRequestOptions): Promise<any> => {
            console.log("Url: " + url);
            console.log("Request options: " + JSON.stringify(options));
        }
    };
    
    it("AuthorityFactory returns null if given url is empty", () => {
        expect(AuthorityFactory.createInstance("", sampleNetworkInterface)).to.be.null;
    });
});
