import { expect } from "chai";
import { IdTokenEntity } from "../../src/unifiedCache/entities/IdTokenEntity";
import { IdTValues } from "./cacheConstants";

describe("IdTokenEntity.ts Unit Tests", () => {
    it("Verify an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        expect(idT instanceof IdTokenEntity);
    });

    it("Create an IdTokenEntity", () => {
        let idT = new IdTokenEntity();
        Object.assign(idT, IdTValues);
        expect(idT.generateIdTokenEntityKey()).to.eql(
            "uid.utid-login.microsoftonline.com-idtoken-mock_client_id-microsoft-"
        );
    });
});
