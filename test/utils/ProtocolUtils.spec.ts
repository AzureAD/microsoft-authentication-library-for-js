import { expect } from "chai";
import { ProtocolUtils } from "../../src/utils/ProtocolUtils";
import { RANDOM_TEST_GUID } from "./StringConstants";
import { Constants } from "../../src";

describe("ProtocolUtils.ts Class Unit Tests", () => {

    it("setRequestState() appends random GUID to given state", () => {
        const testState = "testState";
        const requestState = ProtocolUtils.setRequestState(testState, RANDOM_TEST_GUID);
        expect(requestState).to.be.eq(`${RANDOM_TEST_GUID}${Constants.RESOURCE_DELIM}${testState}`);
    });

    it("setRequestState() only creates random GUID", () => {
        const requestState = ProtocolUtils.setRequestState("", RANDOM_TEST_GUID);
        expect(requestState).to.be.eq(`${RANDOM_TEST_GUID}`);
    });

    it("getUserRequestState() returns blank string if serverResponseState is null or empty", () => {
        expect(ProtocolUtils.getUserRequestState("")).to.be.empty;
        expect(ProtocolUtils.getUserRequestState(null)).to.be.empty;
    });

    it("getUserRequestState() returns empty string if no resource delimiter found in state string", () => {
        const testState = "testState";
        const requestState2 = `${testState}`;
        expect(ProtocolUtils.getUserRequestState(requestState2)).to.be.empty;
    });

    it("getUserRequestState() correctly splits the state by the resource delimiter", () => {
        const testState = "testState";
        const requestState = `${RANDOM_TEST_GUID}${Constants.RESOURCE_DELIM}${testState}`;
        expect(ProtocolUtils.getUserRequestState(requestState)).to.be.eq(testState);
    });
});
