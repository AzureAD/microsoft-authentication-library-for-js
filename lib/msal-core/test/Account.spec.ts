import { expect } from "chai";

import { ClientInfo } from "../src/ClientInfo";
import { IdToken } from "../src/IdToken";
import { Account } from "../src/Account";
import { TEST_TOKENS, TEST_DATA_CLIENT_INFO } from "./TestConstants";
import { CryptoUtils } from "../src/utils/CryptoUtils";


describe("Account.ts Class", function() {

    const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
    const clientInfo: ClientInfo = new ClientInfo(TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO);


    it("verifies account object is created", function () {

        const account = Account.createAccount(idToken, clientInfo);
        expect(account instanceof Account).to.be.true;
    });

    it("verifies homeAccountIdentifier matches", function () {

        const account = Account.createAccount(idToken, clientInfo);
        const homeAccountIdentifier = CryptoUtils.base64Encode(TEST_DATA_CLIENT_INFO.TEST_UID) + "." + CryptoUtils.base64Encode(TEST_DATA_CLIENT_INFO.TEST_UTID);

        expect(account.homeAccountIdentifier).to.equal(homeAccountIdentifier);
    });

    it("verifies Account object created matches the idToken parameters", function () {

        const account = Account.createAccount(idToken, clientInfo);

        if(idToken.objectId != null) {
            expect(account.accountIdentifier).to.equal(idToken.objectId);
        }
        else {
            expect(account.accountIdentifier).to.equal(idToken.subject);
        }

        expect(account.userName).to.equal(idToken.preferredName);
        expect(account.name).to.equal(idToken.name);
        // This will be deprecated soon
        expect(account.idToken).to.equal(idToken.claims);
        expect(account.idTokenClaims).to.equal(idToken.claims);
        expect(account.sid).to.equal(idToken.sid);
        expect(account.environment).to.equal(idToken.issuer);
    });


});
