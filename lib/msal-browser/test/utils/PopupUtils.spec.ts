/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import chai from "chai";
import sinon from "sinon";
import chaiAsPromised from "chai-as-promised";
import { PopupUtils } from "../../src/utils/PopupUtils";
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("PopupUtils Tests", () => {
    afterEach(() => {
        sinon.restore();
    });
    
    describe("openSizedPopup", () => {
        it("opens a popup with urlNavigate", () => {
            const windowOpenSpy = sinon.stub(window, "open");
            PopupUtils.openSizedPopup("http://localhost/", "popup");

            expect(windowOpenSpy.calledWith("http://localhost/", "popup")).to.be.true;
        });

        it("opens a popup with about:blank", () => {
            const windowOpenSpy = sinon.stub(window, "open");
            PopupUtils.openSizedPopup("about:blank", "popup");

            expect(windowOpenSpy.calledWith("about:blank", "popup")).to.be.true;
        });
    });

    describe("generatePopupName", () => {
        it("generates expected name", () => {
            const popupName = PopupUtils.generatePopupName("client-id", {
                scopes: [ "scope1", "scope2"],
                authority: "https://login.microsoftonline.com/common",
                correlationId: "correlation-id"
            });

            expect(popupName).to.equal("msal.client-id.scope1-scope2.https://login.microsoftonline.com/common.correlation-id");
        })
    });
});
