import { expect } from "chai";
import { FetchClient } from "../../src/network/FetchClient";
import sinon from "sinon";

describe("FetchClient.ts Unit Tests", () => {

    let fetchClient: FetchClient;
    beforeEach(() => {
        fetchClient = new FetchClient();
    });

    afterEach(() => {
        sinon.restore();
    });
});
