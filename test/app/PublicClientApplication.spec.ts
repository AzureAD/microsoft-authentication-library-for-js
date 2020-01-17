import * as Mocha from "mocha";
import sinon from "sinon";
import { expect } from "chai";
import { PublicClientApplication } from "../../src/app/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS } from "../utils/StringConstants";
import { AuthError, AuthResponse } from "msal-common";
import { AuthCallback } from "../../src/types/AuthCallback";

describe("PublicClientApplication.ts Class Unit Tests", () => {
    let pca = new PublicClientApplication({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            tmp_clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET
        }
    });

    const authCallback: AuthCallback = (authErr: AuthError, response: AuthResponse) => {
        if (authErr) {
            console.error(authErr);
        } else if (response) {
            console.log(response);
        } else {
            console.log("This shouldn't print, check the test");
        }
    };

    describe("Constructor tests", () => {

        it("passes null check", () => {
            expect(pca).to.be.not.null;
            expect(pca instanceof PublicClientApplication).to.be.true;
        });
    });

    describe("Redirect Flow Unit tests", () => {

        it("handleRedirectCallback throws not implemented error", () => {
            expect(() => pca.handleRedirectCallback(authCallback)).to.throw("Method not implemented.");
            expect(() => pca.handleRedirectCallback(authCallback)).to.throw(Error);
        });

        it("loginRedirect throws throws not implemented error", () => {
            expect(() => pca.loginRedirect({})).to.throw("Method not implemented.");
            expect(() => pca.loginRedirect({})).to.throw(Error);
        });

        it("acquireTokenRedirect throws throws not implemented error", () => {
            expect(() => pca.acquireTokenRedirect({})).to.throw("Method not implemented.");
            expect(() => pca.acquireTokenRedirect({})).to.throw(Error);
        });
    });

    describe("Popup Flow Unit tests", () => {
        it("loginPopup throws throws not implemented error", () => {
            expect(() => pca.loginPopup({})).to.throw("Method not implemented.");
            expect(() => pca.loginPopup({})).to.throw(Error);
        });

        it("acquireTokenPopup throws throws not implemented error", () => {
            expect(() => pca.acquireTokenPopup({})).to.throw("Method not implemented.");
            expect(() => pca.acquireTokenPopup({})).to.throw(Error);
        });
    });

    describe("Acquire Token Silent (Iframe) Tests", () => {

        it("acquireTokenSilent throws throws not implemented error", () => {
            expect(() => pca.acquireTokenSilent({})).to.throw("Method not implemented.");
            expect(() => pca.acquireTokenSilent({})).to.throw(Error);
        });
    });

    describe("Getters and Setters Unit Tests", () => {

        let pca_alternate_redirUris = new PublicClientApplication({
            auth: {
                clientId: TEST_CONFIG.MSAL_CLIENT_ID,
                tmp_clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET,
                redirectUri: TEST_URIS.TEST_ALTERNATE_REDIR_URI,
                postLogoutRedirectUri: TEST_URIS.TEST_LOGOUT_URI
            }
        });

        it("getRedirectUri returns the currently configured redirect uri", () => {
            expect(pca.getRedirectUri()).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(pca_alternate_redirUris.getRedirectUri()).to.be.eq(TEST_URIS.TEST_ALTERNATE_REDIR_URI);
        });

        it("getPostLogoutRedirectUri returns the currently configured post logout redirect uri", () => {
            expect(pca.getPostLogoutRedirectUri()).to.be.eq(TEST_URIS.TEST_REDIR_URI);
            expect(pca_alternate_redirUris.getPostLogoutRedirectUri()).to.be.eq(TEST_URIS.TEST_LOGOUT_URI);
        });
    }); 
});
