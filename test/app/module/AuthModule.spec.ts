import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { AuthModule } from "../../../src/app/module/AuthModule";
import { ModuleConfiguration } from "../../../src/app/config/ModuleConfiguration";
import { AuthenticationParameters } from "../../../src/request/AuthenticationParameters";
import { TEST_HASHES } from "../../utils/StringConstants";

class TestAuthModule extends AuthModule {
    
    constructor(config: ModuleConfiguration) {
        super(config);
    }

    createLoginUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }    
    
    createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }
}

describe("AuthModule.ts Class Unit Tests", () => {

    let config: ModuleConfiguration = {
        cryptoInterface: null,
        networkInterface: null,
        storageInterface: null
    }
    let authModule = new TestAuthModule(config);

    describe("Constructor", () => {

        it("Creates a valid AuthModule object", () => {
            expect(authModule).to.be.not.null;
            expect(authModule instanceof AuthModule).to.be.true;
        });

        it("Handles the authentication response - currently return null", () => {
            expect(authModule.handleFragmentResponse(TEST_HASHES.TEST_SUCCESS_ID_TOKEN_HASH)).to.be.null;
        }) 
    });
});
