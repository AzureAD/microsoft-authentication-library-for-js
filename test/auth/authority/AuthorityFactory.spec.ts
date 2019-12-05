import { expect } from "chai";
import { AuthorityFactory } from "../../../src/auth/authority/AuthorityFactory";
import { INetworkModule } from "../../../src/network/INetworkModule";

describe("AuthorityFactory.ts Class Unit Tests", () => {

    const sampleNetworkInterface: INetworkModule = {
        async sendRequestAsync(url: string, requestParams: RequestInit, enableCaching?:boolean): Promise<any> {
            console.log("Url: " + url);
            console.log("Request params: " + requestParams);
            console.log("Enable caching: " + enableCaching);
        }
    };
    
    it("AuthorityFactory returns null if given url is empty", () => {
        expect(AuthorityFactory.createInstance("", sampleNetworkInterface)).to.be.null;
    });
});
