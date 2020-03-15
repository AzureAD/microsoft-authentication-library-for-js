import * as Mocha from "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
const expect = chai.expect;
chai.use(chaiAsPromised);
import { BaseClient } from "../../src/client/BaseClient";
import { Configuration } from "../../src/config/Configuration";
import { Account } from "../../src";

class TestClient extends BaseClient {

    constructor(config: Configuration, testAccount: Account) {
        super(config);
        this.account = testAccount;
    }
}

describe("BaseClient.ts Class Unit Tests", () => {
    describe("Constructor", () => {

        it("Creates a valid BaseClient object", () => {
            const config: Configuration = {
                systemOptions: null,
                cryptoInterface: null,
                networkInterface: null,
                storageInterface: null,
                loggerOptions: null
            };
            const client = new TestClient(config, null);
            expect(client).to.be.not.null;
            expect(client instanceof BaseClient).to.be.true;
        });
    });
});
