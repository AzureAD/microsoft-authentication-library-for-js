import * as Mocha from "mocha";
import { expect } from "chai";
import { PublicClientApplication } from "../../src/client/PublicClientApplication";
import { TEST_CONFIG, TEST_URIS } from "../utils/StringConstants";
import { AuthError, AuthResponse, LogLevel } from "@azure/msal-common";
import { AuthCallback } from "../../src/types/AuthCallback";

describe("PublicClientApplication.ts Class Unit Tests", () => {
    let pca = new PublicClientApplication({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            tmp_clientSecret: TEST_CONFIG.MSAL_CLIENT_SECRET
        }
    });

    const testLoggerCallback = (level: LogLevel, message: string, containsPii: boolean): void => {
        if (containsPii) {
            console.log(`Log level: ${level} Message: ${message}`);
        }
    }

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
    });

    describe("Popup Flow Unit tests", () => {
    });

    describe("Acquire Token Silent (Iframe) Tests", () => {
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
