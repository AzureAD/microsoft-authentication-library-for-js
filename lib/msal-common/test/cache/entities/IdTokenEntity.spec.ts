import { expect } from "chai";
import { IdTokenEntity } from "../../../src/cache/entities/IdTokenEntity";
import { mockIdTokenEntity } from "./cacheConstants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../../src";
import { CacheType } from "../../../src/utils/Constants";

describe("IdTokenEntity.ts Unit Tests", () => {
    it("Verify an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        expect(idT instanceof IdTokenEntity);
    });

    it("Create an IdTokenEntity", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        expect(idT.generateCredentialKey()).to.eql(
            "uid.utid-login.microsoftonline.com-idtoken-mock_client_id-microsoft-"
        );
    });

    it("Throws error if IdTokenEntity is not assigned a type", () => {
        const idT = new IdTokenEntity();
        expect(() => idT.generateType()).to.throw(ClientAuthError);
        expect(() => idT.generateType()).to.throw(ClientAuthErrorMessage.unexpectedCredentialType.desc);
    });

    it("Generate IdTokenEntity type", () => {
        const idT = new IdTokenEntity();
        Object.assign(idT, mockIdTokenEntity);
        expect(idT.generateType()).to.eql(CacheType.ID_TOKEN);
    });
});
